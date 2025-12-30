'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const supabase = createClient()

    async function loadProfile(userId: string): Promise<Profile | null> {
      console.log('AuthProvider: loading profile for', userId)

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(
            'id, email, full_name, phone, role, customer_type, avatar_url, profile_type, profile_category, onboarding_completed, onboarding_step, referral_source, referral_details, created_at, updated_at'
          )
          .eq('id', userId)
          .single()

        if (error) {
          // PGRST116 = no rows returned (profile doesn't exist yet)
          if (error.code === 'PGRST116') {
            console.log('AuthProvider: profile not found for user, they may need onboarding')
            return null
          }
          // Log other errors but don't crash
          console.error('AuthProvider: profile query error', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          })
          return null
        }

        console.log('AuthProvider: profile loaded', data)
        return data as Profile
      } catch (err) {
        console.error('AuthProvider: profile load failed', err)
        return null
      }
    }

    async function initAuth() {
      console.log('AuthProvider: initializing...')

      try {
        // Get session with timeout
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        )

        const {
          data: { session },
          error,
        } = await Promise.race([sessionPromise, timeoutPromise])

        if (error) {
          console.error('AuthProvider: getSession error', error)
          // If it's a refresh token error, sign out to clear corrupted session
          if (error.message?.includes('Refresh Token') || error.message?.includes('refresh_token')) {
            console.log('AuthProvider: Invalid refresh token, signing out...')
            await supabase.auth.signOut()
          }
          setIsLoading(false)
          return
        }

        console.log('AuthProvider: session', session ? 'exists' : 'null')

        if (session?.user) {
          setSession(session)
          setUser(session.user)

          // Load profile but don't block on it
          loadProfile(session.user.id).then((profileData) => {
            setProfile(profileData)
          })
        }

        setIsLoading(false)
        console.log('AuthProvider: done loading')
      } catch (err) {
        console.error('AuthProvider: init error', err)
        // Handle refresh token errors that might throw
        const errorMessage = err instanceof Error ? err.message : String(err)
        if (errorMessage.includes('Refresh Token') || errorMessage.includes('refresh_token')) {
          console.log('AuthProvider: Invalid refresh token (caught), signing out...')
          try {
            await supabase.auth.signOut()
          } catch {
            // Ignore signout errors
          }
        }
        setIsLoading(false)
      }
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, newSession: Session | null) => {
      console.log('AuthProvider: auth event', event)

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setProfile(null)
      } else if (event === 'TOKEN_REFRESHED' && !newSession) {
        // Token refresh failed, clear the session
        console.log('AuthProvider: Token refresh failed, clearing session')
        setSession(null)
        setUser(null)
        setProfile(null)
      } else if (newSession?.user) {
        setSession(newSession)
        setUser(newSession.user)
        loadProfile(newSession.user.id).then((profileData) => {
          setProfile(profileData)
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const refreshProfile = async () => {
    if (!user) return
    const supabase = createClient()
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select(
        'id, email, full_name, phone, role, customer_type, avatar_url, profile_type, profile_category, onboarding_completed, onboarding_step, referral_source, referral_details, created_at, updated_at'
      )
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('AuthProvider: refreshProfile error', error)
      return
    }
    setProfile(profileData as Profile | null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

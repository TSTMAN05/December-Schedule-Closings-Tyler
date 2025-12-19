'use client'

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
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

      // Add timeout
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Profile load timeout')), 5000)
      )

      const queryPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .then(({ data, error }: { data: any; error: any }) => {
          if (error) {
            console.error('AuthProvider: profile query error', error)
            return null
          }
          console.log('AuthProvider: profile loaded', data)
          return data as Profile
        })

      try {
        const result = await Promise.race([queryPromise, timeoutPromise])
        return result
      } catch (err) {
        console.error('AuthProvider: profile load failed or timed out', err)
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
        setIsLoading(false)
      }
    }

    initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('AuthProvider: auth event', event)

      if (event === 'SIGNED_OUT') {
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
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(profileData as Profile | null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

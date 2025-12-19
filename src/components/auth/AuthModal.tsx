'use client'

import { useState, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui'
import { useAuth } from '@/providers/AuthProvider'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultView?: 'sign_in' | 'sign_up'
  redirectTo?: string
}

export function AuthModal({
  isOpen,
  onClose,
  defaultView = 'sign_in',
  redirectTo,
}: AuthModalProps) {
  const supabase = createClient()
  const { user } = useAuth()
  const [view, setView] = useState<'sign_in' | 'sign_up'>(defaultView)

  // Close modal when user signs in
  useEffect(() => {
    if (user && isOpen) {
      onClose()
    }
  }, [user, isOpen, onClose])

  // Update view when defaultView prop changes
  useEffect(() => {
    setView(defaultView)
  }, [defaultView])

  const getRedirectUrl = () => {
    if (typeof window === 'undefined') return ''
    const baseUrl = window.location.origin
    const redirect = redirectTo || window.location.pathname
    return `${baseUrl}/auth/callback?redirectTo=${encodeURIComponent(redirect)}`
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={view === 'sign_in' ? 'Sign In' : 'Create Account'}
      size="md"
    >
      <div className="pb-2">
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#1e3a8a',
                  brandAccent: '#3b82f6',
                  inputBackground: 'white',
                  inputBorder: '#d1d5db',
                  inputBorderFocus: '#3b82f6',
                  inputBorderHover: '#9ca3af',
                },
                borderWidths: {
                  buttonBorderWidth: '1px',
                  inputBorderWidth: '1px',
                },
                radii: {
                  borderRadiusButton: '0.5rem',
                  buttonBorderRadius: '0.5rem',
                  inputBorderRadius: '0.5rem',
                },
              },
            },
            className: {
              button: 'font-medium',
              input: 'font-normal',
              label: 'font-medium text-gray-700',
              anchor: 'text-blue-600 hover:text-blue-700',
            },
          }}
          providers={['google']}
          redirectTo={getRedirectUrl()}
          view={view}
          showLinks={true}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Sign In',
                link_text: "Don't have an account? Sign up",
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Create Account',
                link_text: 'Already have an account? Sign in',
              },
            },
          }}
        />
      </div>
    </Modal>
  )
}

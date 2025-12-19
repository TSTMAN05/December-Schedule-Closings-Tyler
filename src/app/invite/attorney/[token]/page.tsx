'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { AuthModal } from '@/components/auth'
import { Spinner } from '@/components/ui'
import { CheckCircle, XCircle } from 'lucide-react'

interface Invitation {
  id: string
  email: string
  status: string
  expires_at: string
  law_firms: {
    id: string
    name: string
  }
}

export default function AcceptAttorneyInvitePage() {
  const params = useParams()
  const router = useRouter()
  const { user, profile, isLoading: authLoading } = useAuth()
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    async function fetchInvitation() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('attorney_invitations')
        .select('id, email, status, expires_at, law_firms (id, name)')
        .eq('token', params.token)
        .single()

      if (error || !data) {
        setError('Invalid or expired invitation link.')
      } else if (data.status !== 'pending') {
        setError('This invitation has already been used or cancelled.')
      } else if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired.')
      } else {
        setInvitation(data as Invitation)
      }
      setLoading(false)
    }

    fetchInvitation()
  }, [params.token])

  const handleAccept = async () => {
    if (!user || !invitation) return
    setAccepting(true)

    try {
      const supabase = createClient()

      // Create attorney record
      const { error: attorneyError } = await supabase.from('attorneys').insert({
        profile_id: user.id,
        law_firm_id: invitation.law_firms.id,
        is_active: true,
      })

      if (attorneyError) throw attorneyError

      // Update user's role to attorney
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'attorney' })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Mark invitation as accepted
      await supabase
        .from('attorney_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id)

      // Redirect to attorney dashboard (or law firm for now)
      router.push('/law-firm')
    } catch (err) {
      console.error('Accept error:', err)
      setError('Failed to accept invitation. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Join {invitation?.law_firms.name}
          </h1>
          <p className="text-gray-600 mb-6">
            You've been invited to join as an attorney. Create an account or sign in to accept.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Sign In / Create Account
          </button>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            redirectTo={`/invite/attorney/${params.token}`}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Join {invitation?.law_firms.name}
        </h1>
        <p className="text-gray-600 mb-6">
          You've been invited to join as an attorney. Click below to accept and access your
          dashboard.
        </p>
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {accepting ? 'Accepting...' : 'Accept Invitation'}
        </button>
      </div>
    </div>
  )
}

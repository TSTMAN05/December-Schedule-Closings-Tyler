'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

const REFERRAL_SOURCES = [
  'Referred by a Friend',
  'Referred by a Colleague',
  'Google Search',
  'Social Media',
  'Industry Event',
  'Email/Newsletter',
  'Other',
]

export default function CompletePage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [referralSource, setReferralSource] = useState('')
  const [referralDetails, setReferralDetails] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }

    // Check if admin - admins don't need onboarding
    const checkAdminStatus = async () => {
      if (!user) return
      const supabase = createClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_type')
        .eq('id', user.id)
        .single()

      if (profile?.profile_type === 'admin') {
        router.push('/dashboard')
      }
    }

    if (user) {
      checkAdminStatus()
    }
  }, [user, authLoading, router])

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)

    const supabase = createClient()

    try {
      // Update profile with referral info and mark onboarding complete
      await supabase
        .from('profiles')
        .update({
          referral_source: referralSource || null,
          referral_details: referralDetails || null,
          onboarding_completed: true,
        })
        .eq('id', user.id)

      // Get profile to determine redirect based on profile_type
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_type, role')
        .eq('id', user.id)
        .single()

      // Always redirect to dashboard - role determines what renders there
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      router.push('/dashboard')
    }
  }

  const handleSkip = async () => {
    if (!user) return
    setLoading(true)

    const supabase = createClient()

    try {
      await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id)

      // Always redirect to dashboard - role determines what renders there
      router.push('/dashboard')
    } catch (error) {
      console.error('Error skipping onboarding:', error)
      router.push('/dashboard')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h1>
        <p className="text-gray-600 mb-6">
          But before we send you on your way, we&apos;d like to ask you a few questions
        </p>

        <div className="text-left space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              How did you learn about Schedule Closings?
            </label>
            <select
              value={referralSource}
              onChange={(e) => setReferralSource(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an option</option>
              {REFERRAL_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>

          {(referralSource === 'Referred by a Friend' ||
            referralSource === 'Referred by a Colleague') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Please let us know who to thank
              </label>
              <input
                type="text"
                value={referralDetails}
                onChange={(e) => setReferralDetails(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Their name or email"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            onClick={handleSkip}
            disabled={loading}
            className="text-blue-600 hover:underline disabled:opacity-50"
          >
            Skip to Checklist
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

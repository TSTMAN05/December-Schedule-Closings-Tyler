'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { OrderForm } from '@/components/orders'
import { AuthModal } from '@/components/auth'
import { Spinner } from '@/components/ui'
import { LawFirm } from '@/types'

function NewOrderContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [lawFirm, setLawFirm] = useState<LawFirm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const firmId = searchParams.get('firm')

  // Fetch law firm regardless of auth state
  useEffect(() => {
    if (!firmId) {
      setError('No law firm selected. Please select a law firm from the search page.')
      setLoading(false)
      return
    }

    async function fetchLawFirm() {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('law_firms')
        .select(`
          id, name, slug, email, phone, logo_url, description,
          office_locations (id, name, street_address, city, state, zip_code, latitude, longitude, is_primary)
        `)
        .eq('id', firmId)
        .eq('status', 'active')
        .single()

      if (fetchError || !data) {
        setError('Law firm not found. Please select a different law firm.')
        setLoading(false)
        return
      }

      setLawFirm(data as LawFirm)
      setLoading(false)
    }

    fetchLawFirm()
  }, [firmId])

  // Show auth modal if not logged in after auth loads
  useEffect(() => {
    if (!authLoading && !user) {
      setShowAuthModal(true)
    }
  }, [authLoading, user])

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <a
            href="/search"
            className="text-brand-blue hover:underline"
          >
            Return to Search
          </a>
        </div>
      </div>
    )
  }

  if (!lawFirm) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-blue text-white py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold">Schedule Your Closing</h1>
          <p className="text-blue-100 mt-1">with {lawFirm.name}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {user ? (
          <OrderForm lawFirm={lawFirm} />
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Please sign in to submit your closing request.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-brand-blue text-white px-6 py-2 rounded-lg hover:bg-brand-blue-light transition-colors"
            >
              Sign In to Continue
            </button>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView="sign_up"
        redirectTo={`/order/new?firm=${firmId}`}
      />
    </div>
  )
}

export default function NewOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      }
    >
      <NewOrderContent />
    </Suspense>
  )
}

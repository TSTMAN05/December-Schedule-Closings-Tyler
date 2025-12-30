'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Building, Users, AlertTriangle } from 'lucide-react'
import Image from 'next/image'

const SERVICE_PROVIDER_TYPES = [
  {
    id: 'law_firm',
    label: 'Law Firm',
    description:
      'Attorneys and law firm staff who conduct real estate closings (called Law Firms in attorney states like NC/SC)',
  },
  {
    id: 'title_company',
    label: 'Title Company',
    description:
      'Conduct real estate closings (called Title Companies in title states, same role as Law Firms in attorney states)',
  },
  {
    id: 'title_search',
    label: 'Title Search',
    description:
      'Companies that perform property title examination and research services for attorneys and title companies',
  },
  {
    id: 'title_insurance',
    label: 'Title Insurance',
    description: 'Agencies that issue and underwrite title insurance policies',
  },
  {
    id: 'notary',
    label: 'Notary',
    description:
      'Mobile notary signing agents who perform document notarization and witness signatures at closings',
  },
]

const INDIVIDUAL_TYPES = [
  {
    id: 'customer',
    label: 'Customer',
    description:
      'Buyers, sellers, or refinance clients who want to search, schedule, and manage their own closing appointments',
  },
  {
    id: 'real_estate_agent',
    label: 'Real Estate Agent',
    description:
      "Listing agents, buyer's agents, or brokers who represent clients in real estate transactions",
  },
  {
    id: 'closing_coordinator',
    label: 'Real Estate Closing Coordinator',
    description:
      'Transaction coordinators who work for real estate agents or clients to manage closing paperwork and logistics',
  },
  {
    id: 'lender',
    label: 'Lender / Loan Officer',
    description:
      'Mortgage lenders and loan officers who originate loans and coordinate closing requirements with attorneys',
  },
  {
    id: 'loan_processor',
    label: 'Loan Processor',
    description:
      'Loan processors who work under loan officers to prepare documentation and coordinate loan details',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }

    // Check if user has already started or completed onboarding
    const checkOnboardingStatus = async () => {
      if (!user) return

      const supabase = createClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_step, profile_type')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_completed) {
        // Already completed, redirect to appropriate dashboard
        router.push('/search')
        return
      }

      // If they already selected a type and are past step 1, go to that step
      if (profile?.profile_type && profile.onboarding_step && profile.onboarding_step > 1) {
        router.push(`/onboarding/setup?type=${profile.profile_type}`)
        return
      }

      // If they had a type selected but still on step 1, pre-select it
      if (profile?.profile_type) {
        setSelectedType(profile.profile_type)
      }

      setCheckingStatus(false)
    }

    if (user) {
      checkOnboardingStatus()
    }
  }, [user, authLoading, router])

  const handleNext = async () => {
    if (!selectedType || !user) return
    setLoading(true)

    const supabase = createClient()
    const isServiceProvider = SERVICE_PROVIDER_TYPES.some((t) => t.id === selectedType)

    // Update profile with selected type
    await supabase
      .from('profiles')
      .update({
        profile_type: selectedType,
        profile_category: isServiceProvider ? 'service_provider' : 'individual',
        onboarding_step: 2,
      })
      .eq('id', user.id)

    // Navigate to appropriate setup page
    router.push(`/onboarding/setup?type=${selectedType}`)
  }

  if (authLoading || checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-900 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">SC</span>
          </div>
          <span className="font-semibold text-blue-900">Schedule Closings</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Schedule Closings!</h1>
          <p className="text-gray-600 mt-2">
            Don&apos;t worry, we&apos;ll guide you through setting up your account in no time.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Select a profile type to start...</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
              STEP 1/3
            </span>
          </div>

          {/* Warning Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-yellow-800">
              You&apos;ll need to pick one account type: either a Closing Service Provider or an
              Individual profile. Please note, this choice will be final after completing this
              onboarding process, and you won&apos;t be able to switch or create an additional
              profile of the other type.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Service Provider Column */}
            <div className="border-2 border-gray-100 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Building size={20} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">Closing Service Provider Profile</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">Must be approved to go live</p>

              <div className="space-y-3">
                {SERVICE_PROVIDER_TYPES.map((type) => (
                  <label
                    key={type.id}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="profileType"
                        value={type.id}
                        checked={selectedType === type.id}
                        onChange={() => setSelectedType(type.id)}
                        className="mt-1 text-blue-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{type.label}</p>
                        <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Individual Column */}
            <div className="border-2 border-gray-100 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Users size={20} className="text-green-600" />
                <h3 className="font-semibold text-gray-900">Individual Profile</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">Can have multiple profiles with the same ID</p>

              <div className="space-y-3">
                {INDIVIDUAL_TYPES.map((type) => (
                  <label
                    key={type.id}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedType === type.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="profileType"
                        value={type.id}
                        checked={selectedType === type.id}
                        onChange={() => setSelectedType(type.id)}
                        className="mt-1 text-green-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{type.label}</p>
                        <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-end mt-8">
            <button
              onClick={handleNext}
              disabled={!selectedType || loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Next'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

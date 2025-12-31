'use client'

import { useAuth } from '@/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Spinner } from '@/components/ui'
import { getEffectiveProfileType } from '@/types'
import {
  CustomerView,
  AdminView,
  LawFirmView,
  AttorneyView,
  RealEstateAgentView,
  ClosingCoordinatorView,
  LenderView,
  SERVICE_PROVIDER_TYPES,
} from '@/components/dashboard/views'

export default function DashboardPage() {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()
  const effectiveType = getEffectiveProfileType(profile)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/search')
    }

    // Redirect to onboarding only if:
    // - onboarding not completed AND no profile_type set AND not an admin
    if (!isLoading && user && profile && !profile.onboarding_completed && !effectiveType) {
      router.push('/onboarding')
    }
  }, [isLoading, user, profile, effectiveType, router])

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Admin view
  if (effectiveType === 'admin') {
    return <AdminView />
  }

  // Attorney view
  if (effectiveType === 'attorney') {
    return <AttorneyView />
  }

  // Real estate agent view
  if (effectiveType === 'real_estate_agent') {
    return <RealEstateAgentView />
  }

  // Closing coordinator view
  if (effectiveType === 'closing_coordinator') {
    return <ClosingCoordinatorView />
  }

  // Lender / loan processor view
  if (effectiveType === 'lender' || effectiveType === 'loan_processor') {
    return <LenderView />
  }

  // Service provider types (law_firm, title_company, title_search, title_insurance, notary)
  if (effectiveType && SERVICE_PROVIDER_TYPES.includes(effectiveType as typeof SERVICE_PROVIDER_TYPES[number])) {
    return <LawFirmView />
  }

  // Default to customer view
  return <CustomerView />
}

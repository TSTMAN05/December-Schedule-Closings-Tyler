'use client'

import { useAuth } from '@/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Spinner } from '@/components/ui'
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/search')
    }

    // Redirect to onboarding only if:
    // - onboarding not completed AND no profile_type set AND not an admin
    if (!isLoading && user && profile && !profile.onboarding_completed && !profile.profile_type && profile.role !== 'admin') {
      router.push('/onboarding')
    }
  }, [isLoading, user, profile, router])

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

  // Determine role from profile
  const roleName = profile.profile_type || profile.role || 'customer'

  // Render the appropriate view based on role
  if (roleName === 'admin') {
    return <AdminView />
  }

  if (roleName === 'attorney') {
    return <AttorneyView />
  }

  if (roleName === 'real_estate_agent') {
    return <RealEstateAgentView />
  }

  if (roleName === 'closing_coordinator') {
    return <ClosingCoordinatorView />
  }

  if (roleName === 'lender' || roleName === 'loan_processor') {
    return <LenderView />
  }

  // Service provider types (law_firm, title_company, title_search, title_insurance, notary)
  if (SERVICE_PROVIDER_TYPES.includes(roleName as typeof SERVICE_PROVIDER_TYPES[number])) {
    return <LawFirmView />
  }

  // Default to customer view
  return <CustomerView />
}

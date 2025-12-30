'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { ProfileType } from '@/types'

interface EffectiveRoleResult {
  effectiveRole: ProfileType | null
  effectiveCategory: 'service_provider' | 'individual' | null
  isViewingAs: boolean
  isAdmin: boolean
  actualRole: ProfileType | null
  setViewAsRole: (role: ProfileType | null) => void
  clearViewAs: () => void
}

const SERVICE_PROVIDERS: ProfileType[] = [
  'law_firm',
  'title_company',
  'title_search',
  'title_insurance',
  'notary',
]

export function useEffectiveRole(): EffectiveRoleResult {
  const { profile } = useAuth()
  const [effectiveRole, setEffectiveRole] = useState<ProfileType | null>(null)
  const [isViewingAs, setIsViewingAs] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const actualRole = (profile?.profile_type || profile?.role || null) as ProfileType | null

  useEffect(() => {
    const isUserAdmin = profile?.role === 'admin' || profile?.profile_type === 'admin'
    setIsAdmin(isUserAdmin)

    if (isUserAdmin && typeof window !== 'undefined') {
      // Check if admin is viewing as another role
      const viewAsRole = sessionStorage.getItem('admin_view_as_role') as ProfileType | null
      if (viewAsRole) {
        setEffectiveRole(viewAsRole)
        setIsViewingAs(true)
        return
      }
    }

    // Use actual profile type/role
    setEffectiveRole(actualRole)
    setIsViewingAs(false)
  }, [profile, actualRole])

  const setViewAsRole = (role: ProfileType | null) => {
    if (typeof window === 'undefined') return

    if (role === null || role === 'admin') {
      sessionStorage.removeItem('admin_view_as_role')
      setEffectiveRole(actualRole)
      setIsViewingAs(false)
    } else {
      sessionStorage.setItem('admin_view_as_role', role)
      setEffectiveRole(role)
      setIsViewingAs(true)
    }
  }

  const clearViewAs = () => {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem('admin_view_as_role')
    setEffectiveRole(actualRole)
    setIsViewingAs(false)
  }

  // Determine category
  let effectiveCategory: 'service_provider' | 'individual' | null = null
  if (effectiveRole) {
    if (SERVICE_PROVIDERS.includes(effectiveRole)) {
      effectiveCategory = 'service_provider'
    } else if (effectiveRole !== 'admin' && effectiveRole !== 'attorney') {
      effectiveCategory = 'individual'
    }
  }

  return {
    effectiveRole,
    effectiveCategory,
    isViewingAs,
    isAdmin,
    actualRole,
    setViewAsRole,
    clearViewAs,
  }
}

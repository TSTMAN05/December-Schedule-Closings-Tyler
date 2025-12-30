'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, X, ChevronDown } from 'lucide-react'
import { useEffectiveRole } from '@/hooks/useEffectiveRole'
import { ProfileType } from '@/types'

interface RoleOption {
  id: ProfileType
  label: string
  category: 'system' | 'service_provider' | 'individual'
  dashboard: string
}

// All roles navigate to /dashboard - role determines what renders, not where you go
const ALL_ROLES: RoleOption[] = [
  { id: 'admin', label: 'Administrator', category: 'system', dashboard: '/dashboard' },
  // Service Providers
  { id: 'law_firm', label: 'Law Firm', category: 'service_provider', dashboard: '/dashboard' },
  { id: 'title_company', label: 'Title Company', category: 'service_provider', dashboard: '/dashboard' },
  { id: 'title_search', label: 'Title Search', category: 'service_provider', dashboard: '/dashboard' },
  { id: 'title_insurance', label: 'Title Insurance', category: 'service_provider', dashboard: '/dashboard' },
  { id: 'notary', label: 'Notary', category: 'service_provider', dashboard: '/dashboard' },
  { id: 'attorney', label: 'Attorney', category: 'service_provider', dashboard: '/dashboard' },
  // Individuals
  { id: 'customer', label: 'Customer', category: 'individual', dashboard: '/dashboard' },
  { id: 'real_estate_agent', label: 'Real Estate Agent', category: 'individual', dashboard: '/dashboard' },
  { id: 'closing_coordinator', label: 'Closing Coordinator', category: 'individual', dashboard: '/dashboard' },
  { id: 'lender', label: 'Loan Officer', category: 'individual', dashboard: '/dashboard' },
  { id: 'loan_processor', label: 'Loan Processor', category: 'individual', dashboard: '/dashboard' },
]

export function RoleSwitcher() {
  const router = useRouter()
  const { effectiveRole, isViewingAs, isAdmin, setViewAsRole, clearViewAs } = useEffectiveRole()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRoleChange = (role: RoleOption) => {
    if (role.id === 'admin') {
      clearViewAs()
    } else {
      setViewAsRole(role.id)
    }
    // Always navigate to /dashboard - role determines what renders
    router.push('/dashboard')
    setIsOpen(false)
  }

  const handleExitViewAs = () => {
    clearViewAs()
    router.push('/dashboard')
  }

  if (!isAdmin) return null

  const currentRoleLabel = ALL_ROLES.find((r) => r.id === effectiveRole)?.label || 'Unknown'

  return (
    <>
      {/* Floating banner when viewing as another role */}
      {isViewingAs && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-3 z-50">
          <Eye size={18} />
          <span className="text-sm font-medium">Viewing as: {currentRoleLabel}</span>
          <button
            onClick={handleExitViewAs}
            className="ml-2 p-1 hover:bg-purple-700 rounded-full transition-colors"
            title="Exit preview mode"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Role Switcher Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isViewingAs
              ? 'bg-purple-500 text-white hover:bg-purple-600'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          <Eye size={16} />
          <span className="hidden sm:inline">
            {isViewingAs ? `Viewing: ${currentRoleLabel}` : 'View As'}
          </span>
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border z-50 py-2 max-h-[70vh] overflow-y-auto">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Admin Tools
            </div>

            <button
              onClick={() => handleRoleChange(ALL_ROLES[0])}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                !isViewingAs ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Back to Admin View
            </button>

            <div className="border-t my-2" />

            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Service Providers
            </div>
            {ALL_ROLES.filter((r) => r.category === 'service_provider').map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleChange(role)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                  effectiveRole === role.id && isViewingAs
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {role.label}
              </button>
            ))}

            <div className="border-t my-2" />

            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Individual Profiles
            </div>
            {ALL_ROLES.filter((r) => r.category === 'individual').map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleChange(role)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                  effectiveRole === role.id && isViewingAs
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {role.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

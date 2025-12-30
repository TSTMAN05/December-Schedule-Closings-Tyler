'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LawFirm, OfficeLocation } from '@/types'
import { MapPin, Mail, Phone, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { AuthModal } from '@/components/auth'

interface LawFirmCardProps {
  lawFirm: LawFirm
  onLocationHover?: (location: OfficeLocation | null) => void
}

export function LawFirmCard({ lawFirm, onLocationHover }: LawFirmCardProps) {
  const [showAllLocations, setShowAllLocations] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const locations = lawFirm.office_locations || []
  const primaryLocation = locations.find((loc) => loc.is_primary) || locations[0]
  const hasMultipleLocations = locations.length > 1

  // Show primary location first, then others if expanded
  const displayedLocations = showAllLocations
    ? locations
    : primaryLocation
      ? [primaryLocation]
      : []

  // Generate initials from firm name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter((word) => word.length > 0 && word[0] !== word[0].toLowerCase())
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="flex gap-4">
        {/* Logo or Initials */}
        <div className="flex-shrink-0">
          {lawFirm.logo_url ? (
            <img
              src={lawFirm.logo_url}
              alt={`${lawFirm.name} logo`}
              className="w-16 h-16 object-contain rounded-lg border border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 bg-brand-blue/10 rounded-lg flex items-center justify-center">
              <span className="text-brand-blue font-semibold text-lg">
                {getInitials(lawFirm.name)}
              </span>
            </div>
          )}
        </div>

        {/* Firm Info */}
        <div className="flex-1 min-w-0">
          {/* Firm Name */}
          <Link
            href={`/law-firms/${lawFirm.slug}`}
            className="text-blue-600 hover:underline font-semibold text-lg block truncate"
          >
            {lawFirm.name}
          </Link>

          {/* Contact Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
            <a
              href={`mailto:${lawFirm.email}`}
              className="flex items-center gap-1 hover:text-brand-blue"
            >
              <Mail className="h-4 w-4" />
              <span className="truncate">{lawFirm.email}</span>
            </a>
            <a
              href={`tel:${lawFirm.phone}`}
              className="flex items-center gap-1 hover:text-brand-blue"
            >
              <Phone className="h-4 w-4" />
              <span>{lawFirm.phone}</span>
            </a>
          </div>
        </div>

        {/* Schedule Button */}
        <div className="flex-shrink-0">
          <button
            onClick={() => {
              if (user) {
                router.push(`/order/new?firm=${lawFirm.id}`)
              } else {
                setShowAuthModal(true)
              }
            }}
            className="inline-flex items-center justify-center border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            Schedule
          </button>
        </div>
      </div>

      {/* Office Locations */}
      {displayedLocations.length > 0 && (
        <div className="mt-3 ml-20">
          <div className="space-y-2">
            {displayedLocations.map((location) => (
              <div
                key={location.id}
                className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer hover:text-brand-blue"
                onMouseEnter={() => onLocationHover?.(location)}
                onMouseLeave={() => onLocationHover?.(null)}
              >
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                <div>
                  <span className="font-medium">{location.name}</span>
                  <span className="mx-1">-</span>
                  <span>
                    {location.street_address}, {location.city}, {location.state}{' '}
                    {location.zip_code}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* View All Locations Toggle */}
          {hasMultipleLocations && (
            <button
              onClick={() => setShowAllLocations(!showAllLocations)}
              className="flex items-center gap-1 mt-2 text-sm text-blue-600 hover:underline"
            >
              {showAllLocations ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Locations
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  View All {locations.length} Locations
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView="sign_up"
        redirectTo={`/order/new?firm=${lawFirm.id}`}
      />
    </div>
  )
}

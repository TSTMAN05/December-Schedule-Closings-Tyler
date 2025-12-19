'use client'

import { LawFirm, OfficeLocation } from '@/types'
import { LawFirmCard } from './LawFirmCard'
import { Spinner } from '@/components/ui'
import { Building2 } from 'lucide-react'

interface LawFirmListProps {
  lawFirms: LawFirm[]
  loading: boolean
  error: string | null
  onLocationHover?: (location: OfficeLocation | null) => void
}

export function LawFirmList({
  lawFirms,
  loading,
  error,
  onLocationHover,
}: LawFirmListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading law firms: {error}</p>
      </div>
    )
  }

  if (lawFirms.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No law firms found</p>
        <p className="text-gray-400 text-sm mt-1">
          Try adjusting your search criteria
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Column Headers */}
      <div className="grid grid-cols-2 gap-4 py-3 border-b-2 border-gray-300 text-sm font-semibold text-gray-700">
        <div>Law Firm Name</div>
        <div>Office Locations</div>
      </div>

      {/* Law Firm Cards */}
      <div>
        {lawFirms.map((lawFirm) => (
          <LawFirmCard
            key={lawFirm.id}
            lawFirm={lawFirm}
            onLocationHover={onLocationHover}
          />
        ))}
      </div>

      {/* Results Count */}
      <div className="py-4 text-sm text-gray-500">
        Showing {lawFirms.length} law firm{lawFirms.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

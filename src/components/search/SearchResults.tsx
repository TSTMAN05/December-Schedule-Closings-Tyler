'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLawFirms } from '@/hooks/useLawFirms'
import { SearchFilters } from './SearchFilters'
import { LawFirmList } from './LawFirmList'
import { SearchMap } from './SearchMap'
import { OfficeLocation } from '@/types'

export function SearchResults() {
  const searchParams = useSearchParams()
  const { lawFirms, loading, error } = useLawFirms()

  // Filter states - start empty, let user type their own search
  const [locationFilter, setLocationFilter] = useState('')
  const [firmNameFilter, setFirmNameFilter] = useState('')
  const [accessTypeFilter, setAccessTypeFilter] = useState('')

  // Highlighted location for map interaction
  const [highlightedLocation, setHighlightedLocation] = useState<OfficeLocation | null>(null)

  // Get center from URL params
  const center = useMemo(() => {
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    if (lat && lng) {
      return { lat: parseFloat(lat), lng: parseFloat(lng) }
    }
    return undefined
  }, [searchParams])

  // Filter law firms based on search criteria
  const filteredLawFirms = useMemo(() => {
    return lawFirms.filter((firm) => {
      // Location filter - matches if empty OR any office location matches
      const locationMatch =
        !locationFilter ||
        locationFilter.trim() === '' ||
        firm.office_locations?.some(
          (loc) =>
            loc.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
            loc.state?.toLowerCase().includes(locationFilter.toLowerCase()) ||
            loc.zip_code?.includes(locationFilter)
        )

      // Firm name filter - matches if empty OR name contains search term
      const nameMatch =
        !firmNameFilter ||
        firmNameFilter.trim() === '' ||
        firm.name.toLowerCase().includes(firmNameFilter.toLowerCase())

      return locationMatch && nameMatch
    })
  }, [lawFirms, firmNameFilter, locationFilter])

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Filters - full width */}
      <div className="w-full px-4 border-b border-gray-200 shrink-0">
        <SearchFilters
          locationValue={locationFilter}
          firmNameValue={firmNameFilter}
          accessTypeValue={accessTypeFilter}
          onLocationChange={setLocationFilter}
          onFirmNameChange={setFirmNameFilter}
          onAccessTypeChange={setAccessTypeFilter}
        />
      </div>

      {/* Main content - 50/50 split */}
      <div className="flex-1 flex flex-col lg:flex-row w-full min-h-0">
        {/* Law Firm List - 50% width, scrollable */}
        <div className="w-full lg:w-1/2 overflow-y-auto px-3 order-last lg:order-first">
          <LawFirmList
            lawFirms={filteredLawFirms}
            loading={loading}
            error={error}
            onLocationHover={setHighlightedLocation}
          />
        </div>

        {/* Map - 50% width, fills height */}
        <div className="w-full lg:w-1/2 h-[350px] lg:h-full min-h-[350px]">
          <SearchMap
            lawFirms={filteredLawFirms}
            highlightedLocation={highlightedLocation}
            center={center}
          />
        </div>
      </div>
    </div>
  )
}

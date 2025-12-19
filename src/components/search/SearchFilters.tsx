'use client'

import { Input, Select } from '@/components/ui'
import { MapPin, Building2 } from 'lucide-react'

interface SearchFiltersProps {
  onLocationChange?: (value: string) => void
  onFirmNameChange?: (value: string) => void
  onAccessTypeChange?: (value: string) => void
  locationValue?: string
  firmNameValue?: string
  accessTypeValue?: string
}

const accessTypeOptions = [
  { value: '', label: 'All' },
  { value: 'full', label: 'Full Access' },
  { value: 'limited', label: 'Limited Access' },
]

export function SearchFilters({
  onLocationChange,
  onFirmNameChange,
  onAccessTypeChange,
  locationValue = '',
  firmNameValue = '',
  accessTypeValue = '',
}: SearchFiltersProps) {
  return (
    <div className="bg-white border-b border-gray-200 py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Location Filter */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Input
            placeholder="Enter an Address, City or Zip Code"
            value={locationValue}
            onChange={(e) => onLocationChange?.(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Firm Name Filter */}
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <Input
            placeholder="Enter a Law Firm Name"
            value={firmNameValue}
            onChange={(e) => onFirmNameChange?.(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Access Type Filter */}
        <Select
          options={accessTypeOptions}
          value={accessTypeValue}
          onChange={(e) => onAccessTypeChange?.(e.target.value)}
          placeholder="Select Access Type"
        />
      </div>
    </div>
  )
}

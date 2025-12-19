'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MapboxFeature {
  id: string
  place_name: string
  center: [number, number] // [longitude, latitude]
  context?: Array<{
    id: string
    text: string
    short_code?: string
  }>
  properties?: {
    address?: string
  }
  text: string
  address?: string
}

interface MapboxResponse {
  features: MapboxFeature[]
}

export interface StreetAddressResult {
  fullAddress: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
  longitude: number
  latitude: number
}

interface StreetAddressAutocompleteProps {
  onSelect: (result: StreetAddressResult) => void
  placeholder?: string
  className?: string
  defaultValue?: string
  inputClassName?: string
}

export function StreetAddressAutocomplete({
  onSelect,
  placeholder = 'Enter street address',
  className,
  defaultValue = '',
  inputClassName,
}: StreetAddressAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)

    try {
      const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

      // Search for addresses in the US
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
          new URLSearchParams({
            access_token: accessToken || '',
            country: 'US',
            types: 'address',
            limit: '5',
            autocomplete: 'true',
          })
      )

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }

      const data: MapboxResponse = await response.json()
      setSuggestions(data.features || [])
      setIsOpen(data.features.length > 0)
      setHighlightedIndex(-1)
    } catch (error) {
      console.error('Error fetching address suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, fetchSuggestions])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const parseFeature = (feature: MapboxFeature): StreetAddressResult => {
    let city = ''
    let state = ''
    let zipCode = ''
    let streetAddress = ''

    // The street address is typically: [address number] [street name]
    // feature.address contains the house number, feature.text contains the street name
    if (feature.address) {
      streetAddress = `${feature.address} ${feature.text}`
    } else {
      streetAddress = feature.text
    }

    // Parse context for city, state, zip
    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id.startsWith('place')) {
          city = ctx.text
        } else if (ctx.id.startsWith('region')) {
          state = ctx.short_code?.replace('US-', '') || ctx.text
        } else if (ctx.id.startsWith('postcode')) {
          zipCode = ctx.text
        }
      }
    }

    return {
      fullAddress: feature.place_name,
      streetAddress,
      city,
      state,
      zipCode,
      longitude: feature.center[0],
      latitude: feature.center[1],
    }
  }

  const handleSelect = (feature: MapboxFeature) => {
    const result = parseFeature(feature)
    setQuery(result.streetAddress)
    setSuggestions([])
    setIsOpen(false)
    onSelect(result)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const clearInput = () => {
    setQuery('')
    setSuggestions([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-10 py-2 text-gray-900 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
            inputClassName
          )}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="street-address-suggestions"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
        )}
        {!isLoading && query && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id="street-address-suggestions"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto"
        >
          {suggestions.map((feature, index) => (
            <li
              key={feature.id}
              role="option"
              aria-selected={index === highlightedIndex}
              onClick={() => handleSelect(feature)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                'px-4 py-3 cursor-pointer flex items-start gap-3 transition-colors',
                index === highlightedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              )}
            >
              <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-gray-900 text-sm">{feature.place_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

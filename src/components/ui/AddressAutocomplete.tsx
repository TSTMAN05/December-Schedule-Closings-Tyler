'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddressSuggestion {
  id: string
  place_name: string
  address: string
  city: string
  state: string
  zip: string
  full_address: string
}

interface AddressAutocompleteProps {
  label?: string
  error?: string
  value?: string
  onChange?: (value: string) => void
  onAddressSelect?: (address: {
    street: string
    city: string
    state: string
    zip: string
    full_address: string
  }) => void
  placeholder?: string
  required?: boolean
  className?: string
}

export function AddressAutocomplete({
  label,
  error,
  value = '',
  onChange,
  onAddressSelect,
  placeholder = 'Start typing an address...',
  required,
  className,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update local value when prop changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  const searchAddresses = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      // Search for addresses in the US, focusing on NC and SC
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
        `access_token=${accessToken}&` +
        `country=us&` +
        `types=address&` +
        `limit=5&` +
        `autocomplete=true`
      )

      if (!response.ok) throw new Error('Failed to fetch addresses')

      const data = await response.json()

      const formattedSuggestions: AddressSuggestion[] = data.features.map((feature: {
        id: string
        place_name: string
        text: string
        address?: string
        context?: Array<{ id: string; text: string; short_code?: string }>
      }) => {
        // Parse the address components from context
        const context = feature.context || []
        const streetNumber = feature.address || ''
        const streetName = feature.text || ''
        const street = streetNumber ? `${streetNumber} ${streetName}` : streetName

        let city = ''
        let state = ''
        let zip = ''

        context.forEach((c: { id: string; text: string; short_code?: string }) => {
          if (c.id.startsWith('place')) {
            city = c.text
          } else if (c.id.startsWith('region')) {
            // Get state abbreviation from short_code (e.g., "US-NC" -> "NC")
            state = c.short_code?.replace('US-', '') || c.text
          } else if (c.id.startsWith('postcode')) {
            zip = c.text
          }
        })

        return {
          id: feature.id,
          place_name: feature.place_name,
          address: street,
          city,
          state,
          zip,
          full_address: feature.place_name,
        }
      })

      setSuggestions(formattedSuggestions)
      setShowSuggestions(formattedSuggestions.length > 0)
    } catch (err) {
      console.error('Address search error:', err)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange?.(newValue)
    setSelectedIndex(-1)

    // Debounce the API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue)
    }, 300)
  }

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    setInputValue(suggestion.address)
    onChange?.(suggestion.address)
    onAddressSelect?.({
      street: suggestion.address,
      city: suggestion.city,
      state: suggestion.state,
      zip: suggestion.zip,
      full_address: suggestion.full_address,
    })
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  return (
    <div ref={wrapperRef} className={cn('relative w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <MapPin className="h-4 w-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-10 py-2 border rounded-lg shadow-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent',
            'placeholder:text-gray-400',
            error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
          )}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors',
                index === selectedIndex && 'bg-blue-50',
                index !== suggestions.length - 1 && 'border-b border-gray-100'
              )}
            >
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {suggestion.address}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {suggestion.city}, {suggestion.state} {suggestion.zip}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

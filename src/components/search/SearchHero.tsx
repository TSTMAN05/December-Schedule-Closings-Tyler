'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { Search } from 'lucide-react'
import { AddressAutocomplete, AddressResult } from './AddressAutocomplete'
import { useState } from 'react'

export function SearchHero() {
  const router = useRouter()
  const [selectedLocation, setSelectedLocation] = useState<AddressResult | null>(null)

  const handleSelect = (result: AddressResult) => {
    setSelectedLocation(result)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedLocation) {
      const params = new URLSearchParams()
      if (selectedLocation.city) params.set('city', selectedLocation.city)
      if (selectedLocation.state) params.set('state', selectedLocation.state)
      if (selectedLocation.zipCode) params.set('zip', selectedLocation.zipCode)
      params.set('lat', selectedLocation.latitude.toString())
      params.set('lng', selectedLocation.longitude.toString())

      router.push(`/search?${params.toString()}`)
    } else {
      router.push('/search')
    }
  }

  return (
    <section className="relative text-white py-20 lg:py-32 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/charlotte.webp)',
        }}
      />
      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 bg-brand-blue/50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Find Real Estate Closing Attorneys Near You
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Schedule Closings connects you with qualified real estate attorneys.
            Search, compare, and book your closing appointment in minutes.
          </p>

          {/* Search Box */}
          <div className="bg-white rounded-lg p-2 shadow-xl max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <AddressAutocomplete
                onSelect={handleSelect}
                className="flex-1"
                placeholder="Enter city, state, or ZIP code"
              />
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                <Search className="h-5 w-5 mr-2" />
                Search
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

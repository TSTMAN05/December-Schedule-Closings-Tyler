'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Map, { Marker, Popup, NavigationControl, MapRef, ViewStateChangeEvent, MarkerEvent } from 'react-map-gl/mapbox'
import { LawFirm, OfficeLocation } from '@/types'
import { MapPin } from 'lucide-react'
import Link from 'next/link'
import 'mapbox-gl/dist/mapbox-gl.css'

interface SearchMapProps {
  lawFirms: LawFirm[]
  highlightedLocation?: OfficeLocation | null
  center?: { lat: number; lng: number }
}

interface LocationWithFirm extends OfficeLocation {
  lawFirm: LawFirm
}

// Charlotte, NC default center
const DEFAULT_CENTER = {
  latitude: 35.2271,
  longitude: -80.8431,
}

export function SearchMap({
  lawFirms,
  highlightedLocation,
  center,
}: SearchMapProps) {
  const mapRef = useRef<MapRef>(null)
  const [selectedLocation, setSelectedLocation] = useState<LocationWithFirm | null>(null)
  const [viewState, setViewState] = useState({
    latitude: center?.lat || DEFAULT_CENTER.latitude,
    longitude: center?.lng || DEFAULT_CENTER.longitude,
    zoom: 10,
  })

  // Flatten all locations with their parent firm
  const allLocations: LocationWithFirm[] = lawFirms.flatMap((firm) =>
    (firm.office_locations || []).map((loc) => ({
      ...loc,
      lawFirm: firm,
    }))
  )

  // Update view when center prop changes
  useEffect(() => {
    if (center) {
      setViewState((prev) => ({
        ...prev,
        latitude: center.lat,
        longitude: center.lng,
      }))
    }
  }, [center])

  // Pan to highlighted location
  useEffect(() => {
    if (highlightedLocation && mapRef.current) {
      const lat = Number(highlightedLocation.latitude)
      const lng = Number(highlightedLocation.longitude)
      if (!isNaN(lat) && !isNaN(lng)) {
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: 14,
          duration: 500,
        })
      }
    }
  }, [highlightedLocation])

  const handleMarkerClick = useCallback((location: LocationWithFirm) => {
    setSelectedLocation(location)
  }, [])

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  if (!mapboxToken) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">Map unavailable - Missing API token</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-left" />

        {/* Markers */}
        {allLocations.map((location) => {
          const lat = Number(location.latitude)
          const lng = Number(location.longitude)
          if (isNaN(lat) || isNaN(lng)) return null

          const isHighlighted = highlightedLocation?.id === location.id

          return (
            <Marker
              key={location.id}
              latitude={lat}
              longitude={lng}
              anchor="bottom"
              onClick={(e: MarkerEvent<MouseEvent>) => {
                e.originalEvent.stopPropagation()
                handleMarkerClick(location)
              }}
            >
              <div
                className={`cursor-pointer transition-transform ${
                  isHighlighted ? 'scale-125' : ''
                }`}
              >
                <div
                  className={`p-1.5 rounded-full shadow-md ${
                    isHighlighted
                      ? 'bg-brand-blue-light text-white'
                      : 'bg-brand-blue text-white'
                  }`}
                >
                  <MapPin className="h-5 w-5" />
                </div>
              </div>
            </Marker>
          )
        })}

        {/* Popup */}
        {selectedLocation && (
          <Popup
            latitude={Number(selectedLocation.latitude)}
            longitude={Number(selectedLocation.longitude)}
            anchor="bottom"
            onClose={() => setSelectedLocation(null)}
            closeButton={true}
            closeOnClick={false}
            offset={25}
          >
            <div className="p-2 min-w-[200px]">
              <Link
                href={`/law-firm/${selectedLocation.lawFirm.slug}`}
                className="text-blue-600 hover:underline font-semibold block"
              >
                {selectedLocation.lawFirm.name}
              </Link>
              <p className="text-sm text-gray-600 mt-1">
                {selectedLocation.name}
              </p>
              <p className="text-sm text-gray-500">
                {selectedLocation.street_address}
              </p>
              <p className="text-sm text-gray-500">
                {selectedLocation.city}, {selectedLocation.state}{' '}
                {selectedLocation.zip_code}
              </p>
              <Link
                href={`/order/new?firm=${selectedLocation.lawFirm.id}&location=${selectedLocation.id}`}
                className="inline-block mt-2 text-sm border border-blue-600 text-blue-600 hover:bg-blue-50 rounded px-3 py-1"
              >
                Schedule
              </Link>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { Building, MapPin, Phone, Mail, Globe, Clock } from 'lucide-react'

interface LawFirm {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  email: string | null
  website: string | null
  description: string | null
  created_at: string
}

export default function LawFirmSettingsPage() {
  const { user } = useAuth()
  const [lawFirm, setLawFirm] = useState<LawFirm | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const userId = user.id

    async function fetchLawFirm() {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('law_firms')
        .select('*')
        .eq('owner_id', userId)
        .single()

      if (!error && data) {
        setLawFirm(data)
      }

      setLoading(false)
    }

    fetchLawFirm()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!lawFirm) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">No law firm found for this account.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Firm Settings</h1>

      {/* Firm Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building size={20} />
          Firm Information
        </h2>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dt className="text-sm text-gray-600">Firm Name</dt>
            <dd className="font-medium text-gray-900">{lawFirm.name}</dd>
          </div>

          {lawFirm.description && (
            <div className="md:col-span-2">
              <dt className="text-sm text-gray-600">Description</dt>
              <dd className="font-medium text-gray-900">{lawFirm.description}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Phone size={20} />
          Contact Information
        </h2>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dt className="text-sm text-gray-600 flex items-center gap-1">
              <Mail size={14} />
              Email
            </dt>
            <dd className="font-medium text-gray-900">{lawFirm.email || 'Not set'}</dd>
          </div>

          <div>
            <dt className="text-sm text-gray-600 flex items-center gap-1">
              <Phone size={14} />
              Phone
            </dt>
            <dd className="font-medium text-gray-900">{lawFirm.phone || 'Not set'}</dd>
          </div>

          <div>
            <dt className="text-sm text-gray-600 flex items-center gap-1">
              <Globe size={14} />
              Website
            </dt>
            <dd className="font-medium text-gray-900">
              {lawFirm.website ? (
                <a
                  href={lawFirm.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {lawFirm.website}
                </a>
              ) : (
                'Not set'
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Address */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin size={20} />
          Address
        </h2>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dt className="text-sm text-gray-600">Street Address</dt>
            <dd className="font-medium text-gray-900">{lawFirm.address || 'Not set'}</dd>
          </div>

          <div>
            <dt className="text-sm text-gray-600">City</dt>
            <dd className="font-medium text-gray-900">{lawFirm.city || 'Not set'}</dd>
          </div>

          <div>
            <dt className="text-sm text-gray-600">State</dt>
            <dd className="font-medium text-gray-900">{lawFirm.state || 'Not set'}</dd>
          </div>

          <div>
            <dt className="text-sm text-gray-600">ZIP Code</dt>
            <dd className="font-medium text-gray-900">{lawFirm.zip || 'Not set'}</dd>
          </div>
        </dl>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={20} />
          Account Information
        </h2>

        <dl>
          <div>
            <dt className="text-sm text-gray-600">Member Since</dt>
            <dd className="font-medium text-gray-900">
              {new Date(lawFirm.created_at).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      {/* Edit Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Settings editing coming soon. Contact support to update your firm information.
        </p>
      </div>
    </div>
  )
}

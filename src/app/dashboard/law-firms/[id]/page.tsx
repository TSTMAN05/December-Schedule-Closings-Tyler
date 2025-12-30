'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { AdminNotes } from '@/components/admin'
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  Save,
  CheckCircle,
  XCircle,
  Trash2,
  Ban,
} from 'lucide-react'
import type { LawFirmStatus } from '@/types'

interface OfficeLocation {
  id: string
  name: string
  street_address: string
  city: string
  state: string
  zip_code: string
  phone: string | null
  is_primary: boolean
}

interface Attorney {
  id: string
  title: string | null
  bar_number: string | null
  is_active: boolean
  is_disabled?: boolean | null
  disabled_at?: string | null
  disabled_reason?: string | null
  profiles: { id: string; full_name: string; email: string } | null
}

interface LawFirmDetail {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  website: string | null
  description: string | null
  status: LawFirmStatus
  created_at: string
  updated_at: string
  owner_id: string | null
  profiles: { id: string; full_name: string; email: string } | null
  office_locations: OfficeLocation[]
  attorneys: Attorney[]
}

export default function DashboardLawFirmDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const firmId = params.id as string

  const isAdmin = profile?.role === 'admin'

  const [firm, setFirm] = useState<LawFirmDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    status: 'pending' as LawFirmStatus,
  })

  useEffect(() => {
    fetchFirm()
  }, [firmId])

  async function fetchFirm() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('law_firms')
      .select(
        `
        *,
        profiles:owner_id(id, full_name, email),
        office_locations(*),
        attorneys(id, title, bar_number, is_active, is_disabled, disabled_at, disabled_reason, profiles(id, full_name, email))
      `
      )
      .eq('id', firmId)
      .single()

    if (!error && data) {
      setFirm(data as LawFirmDetail)
      setEditForm({
        name: data.name,
        email: data.email,
        phone: data.phone,
        website: data.website || '',
        description: data.description || '',
        status: data.status,
      })
    }
    setLoading(false)
  }

  const saveFirm = async () => {
    if (!isAdmin) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('law_firms')
      .update({
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        website: editForm.website || null,
        description: editForm.description || null,
        status: editForm.status,
      })
      .eq('id', firmId)

    if (!error) {
      if (editForm.status === 'active' && firm?.owner_id) {
        await supabase.from('profiles').update({ role: 'law_firm' }).eq('id', firm.owner_id)
      }

      setFirm({ ...firm!, ...editForm })
      setEditMode(false)
    }
    setSaving(false)
  }

  const updateStatus = async (newStatus: LawFirmStatus) => {
    if (!isAdmin) return

    const supabase = createClient()

    const { error } = await supabase.from('law_firms').update({ status: newStatus }).eq('id', firmId)

    if (!error) {
      if (newStatus === 'active' && firm?.owner_id) {
        await supabase.from('profiles').update({ role: 'law_firm' }).eq('id', firm.owner_id)
      }

      setFirm({ ...firm!, status: newStatus })
      setEditForm({ ...editForm, status: newStatus })
    }
  }

  const deleteLocation = async (locationId: string) => {
    if (!isAdmin) return
    if (!confirm('Are you sure you want to delete this location?')) return

    const supabase = createClient()
    const { error } = await supabase.from('office_locations').delete().eq('id', locationId)

    if (!error && firm) {
      setFirm({
        ...firm,
        office_locations: firm.office_locations.filter((loc) => loc.id !== locationId),
      })
    }
  }

  const removeAttorney = async (attorneyId: string) => {
    if (!isAdmin) return
    if (!confirm('Are you sure you want to remove this attorney from the firm?')) return

    const supabase = createClient()
    const { error } = await supabase.from('attorneys').delete().eq('id', attorneyId)

    if (!error && firm) {
      setFirm({
        ...firm,
        attorneys: firm.attorneys.filter((att) => att.id !== attorneyId),
      })
    }
  }

  const toggleAttorneyDisabled = async (attorneyId: string, currentlyDisabled: boolean) => {
    if (!isAdmin) return

    const supabase = createClient()
    const updateData = currentlyDisabled
      ? { is_disabled: false, disabled_at: null, disabled_reason: null }
      : { is_disabled: true, disabled_at: new Date().toISOString(), disabled_reason: 'Disabled by admin' }

    const { error } = await supabase.from('attorneys').update(updateData).eq('id', attorneyId)

    if (!error && firm) {
      setFirm({
        ...firm,
        attorneys: firm.attorneys.map((att) =>
          att.id === attorneyId
            ? { ...att, is_disabled: !currentlyDisabled, disabled_at: updateData.disabled_at, disabled_reason: updateData.disabled_reason }
            : att
        ),
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!firm) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">Law firm not found</p>
        <Link href="/dashboard/law-firms" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Law Firms
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/law-firms"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{firm.name}</h1>
            <p className="text-sm text-gray-500">/{firm.slug}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Firm
              </button>
            ) : (
              <>
                <button
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveFirm}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Status Bar - Admin Only */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  firm.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : firm.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {firm.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {firm.status === 'pending' && (
                <>
                  <button
                    onClick={() => updateStatus('active')}
                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus('inactive')}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1 text-sm"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </>
              )}
              {firm.status === 'active' && (
                <button
                  onClick={() => updateStatus('inactive')}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1 text-sm"
                >
                  <XCircle size={16} />
                  Deactivate
                </button>
              )}
              {firm.status === 'inactive' && (
                <button
                  onClick={() => updateStatus('active')}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm"
                >
                  <CheckCircle size={16} />
                  Activate
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Firm Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building size={20} />
            Firm Details
          </h2>

          {editMode && isAdmin ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail size={16} className="text-gray-400" />
                {firm.email}
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone size={16} className="text-gray-400" />
                {firm.phone}
              </div>
              {firm.website && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Globe size={16} className="text-gray-400" />
                  <a href={firm.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {firm.website}
                  </a>
                </div>
              )}
              {firm.description && <p className="text-gray-600 mt-4">{firm.description}</p>}
              <div className="pt-4 border-t mt-4">
                <p className="text-sm text-gray-500">
                  Registered: {new Date(firm.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Last Updated: {new Date(firm.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Owner Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={20} />
            Owner Information
          </h2>
          {firm.profiles ? (
            <div className="space-y-3">
              <p className="font-medium text-gray-900">{firm.profiles.full_name}</p>
              <p className="text-gray-600">{firm.profiles.email}</p>
              {isAdmin && (
                <Link
                  href={`/dashboard/users?search=${encodeURIComponent(firm.profiles.email)}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View User Profile
                </Link>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No owner assigned</p>
          )}
        </div>

        {/* Office Locations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin size={20} />
              Office Locations ({firm.office_locations.length})
            </h2>
          </div>
          {firm.office_locations.length === 0 ? (
            <p className="text-gray-500">No office locations</p>
          ) : (
            <div className="space-y-4">
              {firm.office_locations.map((location) => (
                <div key={location.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        {location.name}
                        {location.is_primary && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">{location.street_address}</p>
                      <p className="text-sm text-gray-600">
                        {location.city}, {location.state} {location.zip_code}
                      </p>
                      {location.phone && (
                        <p className="text-sm text-gray-500 mt-1">{location.phone}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => deleteLocation(location.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete Location"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attorneys */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User size={20} />
              Attorneys ({firm.attorneys.length})
            </h2>
          </div>
          {firm.attorneys.length === 0 ? (
            <p className="text-gray-500">No attorneys registered</p>
          ) : (
            <div className="space-y-4">
              {firm.attorneys.map((attorney) => (
                <div key={attorney.id} className={`p-3 border rounded-lg ${attorney.is_disabled ? 'bg-red-50 border-red-200' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${attorney.is_disabled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {attorney.profiles?.full_name || 'Unknown'}
                        </p>
                        {attorney.is_disabled && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{attorney.profiles?.email}</p>
                      {attorney.title && (
                        <p className="text-sm text-gray-500">{attorney.title}</p>
                      )}
                      {attorney.bar_number && (
                        <p className="text-xs text-gray-400">Bar #: {attorney.bar_number}</p>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded mt-1 inline-block ${
                          attorney.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {attorney.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleAttorneyDisabled(attorney.id, !!attorney.is_disabled)}
                          className={`p-1 rounded ${
                            attorney.is_disabled
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-orange-600 hover:bg-orange-50'
                          }`}
                          title={attorney.is_disabled ? 'Enable Attorney' : 'Disable Attorney'}
                        >
                          {attorney.is_disabled ? <CheckCircle size={16} /> : <Ban size={16} />}
                        </button>
                        <button
                          onClick={() => removeAttorney(attorney.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Remove Attorney"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin Notes Section */}
      {isAdmin && (
        <AdminNotes entityType="law_firm" entityId={firmId} />
      )}
    </div>
  )
}

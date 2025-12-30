'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { Search, CheckCircle, XCircle, Eye, Ban } from 'lucide-react'

interface LawFirm {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  status: string
  created_at: string
  profiles: { full_name: string; email: string } | null
  is_disabled?: boolean | null
  disabled_at?: string | null
  disabled_reason?: string | null
}

function LawFirmsContent() {
  const { profile } = useAuth()
  const searchParams = useSearchParams()
  const [firms, setFirms] = useState<LawFirm[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [updating, setUpdating] = useState<string | null>(null)

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    fetchFirms()
  }, [])

  async function fetchFirms() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('law_firms')
      .select(
        'id, name, slug, email, phone, status, created_at, is_disabled, disabled_at, disabled_reason, profiles:owner_id (full_name, email)'
      )
      .order('created_at', { ascending: false })

    if (!error && data) {
      setFirms(data as LawFirm[])
    }
    setLoading(false)
  }

  const updateStatus = async (firmId: string, newStatus: string) => {
    if (!isAdmin) return

    setUpdating(firmId)
    const supabase = createClient()

    const firm = firms.find((f) => f.id === firmId)

    const { error } = await supabase.from('law_firms').update({ status: newStatus }).eq('id', firmId)

    if (!error) {
      if (newStatus === 'active' && firm?.profiles) {
        const { data: lawFirmData } = await supabase
          .from('law_firms')
          .select('owner_id')
          .eq('id', firmId)
          .single()

        if (lawFirmData?.owner_id) {
          await supabase
            .from('profiles')
            .update({ role: 'law_firm' })
            .eq('id', lawFirmData.owner_id)
        }
      }

      setFirms(firms.map((f) => (f.id === firmId ? { ...f, status: newStatus } : f)))
    }
    setUpdating(null)
  }

  const toggleFirmDisabled = async (firmId: string, currentlyDisabled: boolean) => {
    if (!isAdmin) return

    setUpdating(firmId)
    const supabase = createClient()
    const updateData = currentlyDisabled
      ? { is_disabled: false, disabled_at: null, disabled_reason: null }
      : { is_disabled: true, disabled_at: new Date().toISOString(), disabled_reason: 'Disabled by admin' }

    const { error } = await supabase.from('law_firms').update(updateData).eq('id', firmId)

    if (!error) {
      setFirms(
        firms.map((f) =>
          f.id === firmId
            ? { ...f, is_disabled: !currentlyDisabled, disabled_at: updateData.disabled_at, disabled_reason: updateData.disabled_reason }
            : f
        )
      )
    }
    setUpdating(null)
  }

  const filteredFirms = firms.filter((firm) => {
    const matchesSearch =
      searchTerm === '' ||
      firm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      firm.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || firm.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Law Firms</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>

          {isAdmin && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          )}
        </div>
      </div>

      {/* Firms Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredFirms.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No law firms found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                    Firm Name
                  </th>
                  {isAdmin && (
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Owner</th>
                  )}
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Contact</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                    Registered
                  </th>
                  {isAdmin && (
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredFirms.map((firm) => (
                  <tr key={firm.id} className={`hover:bg-gray-50 ${firm.is_disabled ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${firm.is_disabled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {firm.name}
                        </p>
                        {firm.is_disabled && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">/{firm.slug}</p>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {firm.profiles?.full_name || 'Unknown'}
                        <br />
                        <span className="text-xs text-gray-400">{firm.profiles?.email}</span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {firm.email}
                      <br />
                      <span className="text-xs text-gray-400">{firm.phone}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          firm.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : firm.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {firm.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(firm.created_at).toLocaleDateString()}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {firm.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateStatus(firm.id, 'active')}
                                disabled={updating === firm.id}
                                className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => updateStatus(firm.id, 'inactive')}
                                disabled={updating === firm.id}
                                className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          {firm.status === 'active' && (
                            <button
                              onClick={() => updateStatus(firm.id, 'inactive')}
                              disabled={updating === firm.id}
                              className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                              title="Deactivate"
                            >
                              <XCircle size={18} />
                            </button>
                          )}
                          {firm.status === 'inactive' && (
                            <button
                              onClick={() => updateStatus(firm.id, 'active')}
                              disabled={updating === firm.id}
                              className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                              title="Activate"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          <Link
                            href={`/dashboard/law-firms/${firm.id}`}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </Link>
                          <button
                            onClick={() => toggleFirmDisabled(firm.id, !!firm.is_disabled)}
                            disabled={updating === firm.id}
                            className={`p-1 rounded disabled:opacity-50 ${
                              firm.is_disabled
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-orange-600 hover:bg-orange-50'
                            }`}
                            title={firm.is_disabled ? 'Enable Firm' : 'Disable Firm (Soft Lock)'}
                          >
                            {firm.is_disabled ? <CheckCircle size={18} /> : <Ban size={18} />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardLawFirmsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      }
    >
      <LawFirmsContent />
    </Suspense>
  )
}

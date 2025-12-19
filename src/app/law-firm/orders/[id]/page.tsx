'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { ArrowLeft, Calendar, MapPin, User, Mail, Phone, FileText } from 'lucide-react'

interface Order {
  id: string
  order_number: string
  status: string
  property_street: string
  property_city: string
  property_state: string
  property_zip: string
  closing_type: string
  estimated_closing_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  customer: { id: string; full_name: string; email: string; phone: string | null } | null
  assigned_attorney_id: string | null
  assigned_attorney: { id: string; full_name: string; email: string } | null
}

interface Attorney {
  id: string
  full_name: string
  email: string
}

export default function LawFirmOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [attorneys, setAttorneys] = useState<Attorney[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedAttorney, setSelectedAttorney] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  useEffect(() => {
    if (!user || !params.id) return

    const userId = user.id

    async function fetchData() {
      const supabase = createClient()

      // First get the law firm ID
      const { data: lawFirm } = await supabase
        .from('law_firms')
        .select('id')
        .eq('owner_id', userId)
        .single()

      if (!lawFirm) {
        setLoading(false)
        return
      }

      // Fetch order details
      const { data: orderData, error } = await supabase
        .from('orders')
        .select(
          `
          id, order_number, status, property_street, property_city, property_state,
          property_zip, closing_type, estimated_closing_date, notes, created_at, updated_at,
          assigned_attorney_id,
          customer:profiles!orders_customer_id_fkey (id, full_name, email, phone),
          assigned_attorney:profiles!orders_assigned_attorney_id_fkey (id, full_name, email)
        `
        )
        .eq('id', params.id)
        .eq('law_firm_id', lawFirm.id)
        .single()

      if (error || !orderData) {
        router.push('/law-firm/orders')
        return
      }

      setOrder(orderData as Order)
      setSelectedAttorney(orderData.assigned_attorney_id || '')
      setSelectedStatus(orderData.status)

      // Fetch attorneys for this law firm
      const { data: attorneysData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'attorney')
        .eq('law_firm_id', lawFirm.id)

      if (attorneysData) {
        setAttorneys(attorneysData)
      }

      setLoading(false)
    }

    fetchData()
  }, [user, params.id, router])

  const handleSave = async () => {
    if (!order) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('orders')
      .update({
        assigned_attorney_id: selectedAttorney || null,
        status: selectedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (!error) {
      setOrder({
        ...order,
        assigned_attorney_id: selectedAttorney || null,
        status: selectedStatus,
        assigned_attorney: attorneys.find((a) => a.id === selectedAttorney) || null,
      })
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">Order not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/law-firm/orders"
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order {order.order_number}</h1>
          <p className="text-sm text-gray-600">
            Created {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Property Details
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-600">Address</dt>
                <dd className="font-medium text-gray-900">{order.property_street}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">City</dt>
                <dd className="font-medium text-gray-900">{order.property_city}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">State</dt>
                <dd className="font-medium text-gray-900">{order.property_state}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">ZIP Code</dt>
                <dd className="font-medium text-gray-900">{order.property_zip}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Closing Type</dt>
                <dd className="font-medium text-gray-900 capitalize">{order.closing_type}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600">Estimated Closing Date</dt>
                <dd className="font-medium text-gray-900">
                  {order.estimated_closing_date
                    ? new Date(order.estimated_closing_date).toLocaleDateString()
                    : 'Not set'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Customer Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Customer Information
            </h2>
            {order.customer ? (
              <dl className="space-y-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {order.customer.full_name || 'Not provided'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  <a
                    href={`mailto:${order.customer.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {order.customer.email}
                  </a>
                </div>
                {order.customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {order.customer.phone}
                    </a>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-gray-600">Customer information not available</p>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} />
                Notes
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Assignment */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Management</h2>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Attorney Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Attorney
                </label>
                <select
                  value={selectedAttorney}
                  onChange={(e) => setSelectedAttorney(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {attorneys.map((attorney) => (
                    <option key={attorney.id} value={attorney.id}>
                      {attorney.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Timeline
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-600">Created</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(order.created_at).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600">Last Updated</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(order.updated_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

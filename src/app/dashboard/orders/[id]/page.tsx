'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { AdminNotes } from '@/components/admin'
import { OrderTimeline } from '@/components/orders'
import {
  ArrowLeft,
  FileText,
  User,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MessageSquare,
  Send,
} from 'lucide-react'
import type { OrderStatus } from '@/types'

interface OrderNote {
  id: string
  note: string
  is_internal: boolean
  created_at: string
  author: { full_name: string; email: string } | null
}

interface OrderDetail {
  id: string
  order_number: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_role: string
  property_street: string
  property_city: string
  property_state: string
  property_zip: string
  property_type: string
  closing_type: string
  estimated_closing_date: string | null
  sale_amount: number | null
  status: OrderStatus
  notes: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  law_firm_id: string
  law_firms: { id: string; name: string; email: string; phone: string } | null
  assigned_attorney: {
    id: string
    profiles: { full_name: string; email: string } | null
  } | null
  office_locations: { id: string; name: string; city: string; state: string } | null
  order_notes: OrderNote[]
}

interface Attorney {
  id: string
  profiles: { full_name: string } | null
  is_active: boolean
}

export default function DashboardOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile, user } = useAuth()
  const orderId = params.id as string

  const isAdmin = profile?.role === 'admin'
  const isLawFirm = profile?.role === 'law_firm' || profile?.profile_type === 'law_firm'

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [attorneys, setAttorneys] = useState<Attorney[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(true)
  const [addingNote, setAddingNote] = useState(false)

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  async function fetchOrder() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        law_firms(id, name, email, phone),
        assigned_attorney:attorneys(id, profiles(full_name, email)),
        office_locations(id, name, city, state),
        order_notes(id, note, is_internal, created_at, author:profiles(full_name, email))
      `
      )
      .eq('id', orderId)
      .single()

    if (!error && data) {
      setOrder(data as OrderDetail)

      // Fetch attorneys for this law firm (admin and law firm only)
      if ((isAdmin || isLawFirm) && data.law_firms) {
        const { data: attorneyData } = await supabase
          .from('attorneys')
          .select('id, profiles(full_name), is_active')
          .eq('law_firm_id', data.law_firms.id)
          .eq('is_active', true)

        if (attorneyData) {
          setAttorneys(attorneyData as Attorney[])
        }
      }
    }
    setLoading(false)
  }

  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (!isAdmin && !isLawFirm) return

    setSaving(true)
    const supabase = createClient()

    const updateData: { status: OrderStatus; completed_at?: string | null } = { status: newStatus }
    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else {
      updateData.completed_at = null
    }

    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId)

    if (!error && order) {
      setOrder({ ...order, status: newStatus, completed_at: updateData.completed_at || null })
    }
    setSaving(false)
  }

  const assignAttorney = async (attorneyId: string) => {
    if (!isAdmin && !isLawFirm) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('orders')
      .update({ assigned_attorney_id: attorneyId || null })
      .eq('id', orderId)

    if (!error) {
      fetchOrder()
    }
    setSaving(false)
  }

  const addNote = async () => {
    if (!newNote.trim() || !user) return

    setAddingNote(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('order_notes')
      .insert({
        order_id: orderId,
        author_id: user.id,
        note: newNote,
        is_internal: isInternalNote,
      })
      .select('id, note, is_internal, created_at, author:profiles(full_name, email)')
      .single()

    if (!error && data && order) {
      setOrder({
        ...order,
        order_notes: [...order.order_notes, data as OrderNote],
      })
      setNewNote('')
    }
    setAddingNote(false)
  }

  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
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
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">Order not found</p>
        <Link href="/dashboard/orders" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Orders
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText size={24} />
              {order.order_number}
            </h1>
            <p className="text-sm text-gray-500">
              Created {new Date(order.created_at).toLocaleDateString()} at{' '}
              {new Date(order.created_at).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Status & Assignment Bar - Admin/Law Firm Only */}
      {(isAdmin || isLawFirm) && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Status:</span>
              <select
                value={order.status}
                onChange={(e) => updateOrderStatus(e.target.value as OrderStatus)}
                disabled={saving}
                className={`px-3 py-1 rounded-full text-sm font-medium border-0 cursor-pointer ${getStatusBadgeColor(order.status)}`}
              >
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Assigned Attorney:</span>
              <select
                value={order.assigned_attorney?.id || ''}
                onChange={(e) => assignAttorney(e.target.value)}
                disabled={saving || attorneys.length === 0}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Unassigned</option>
                {attorneys.map((attorney) => (
                  <option key={attorney.id} value={attorney.id}>
                    {attorney.profiles?.full_name || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Status Badge for non-admin/non-law-firm */}
      {!isAdmin && !isLawFirm && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(order.status)}`}>
              {order.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={20} />
            Customer Information
          </h2>
          <div className="space-y-3">
            <p className="font-medium text-gray-900">{order.customer_name}</p>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={16} className="text-gray-400" />
              <a href={`mailto:${order.customer_email}`} className="hover:text-blue-600">
                {order.customer_email}
              </a>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={16} className="text-gray-400" />
              <a href={`tel:${order.customer_phone}`} className="hover:text-blue-600">
                {order.customer_phone}
              </a>
            </div>
            <div className="pt-2">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                {order.customer_role.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Property Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={20} />
            Property Information
          </h2>
          <div className="space-y-3">
            <p className="text-gray-900">{order.property_street}</p>
            <p className="text-gray-600">
              {order.property_city}, {order.property_state} {order.property_zip}
            </p>
            <div className="flex gap-2 pt-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
                {order.property_type}
              </span>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded capitalize">
                {order.closing_type}
              </span>
            </div>
          </div>
        </div>

        {/* Law Firm Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building size={20} />
            Law Firm
          </h2>
          {order.law_firms ? (
            <div className="space-y-3">
              {isAdmin ? (
                <Link
                  href={`/dashboard/law-firms/${order.law_firms.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {order.law_firms.name}
                </Link>
              ) : (
                <p className="font-medium text-gray-900">{order.law_firms.name}</p>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={16} className="text-gray-400" />
                {order.law_firms.email}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={16} className="text-gray-400" />
                {order.law_firms.phone}
              </div>
              {order.office_locations && (
                <p className="text-sm text-gray-500">
                  Office: {order.office_locations.name} - {order.office_locations.city},{' '}
                  {order.office_locations.state}
                </p>
              )}
              {order.assigned_attorney?.profiles && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600">
                    Assigned to:{' '}
                    <span className="font-medium">{order.assigned_attorney.profiles.full_name}</span>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No law firm assigned</p>
          )}
        </div>

        {/* Transaction Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign size={20} />
            Transaction Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Sale Amount:</span>
              <span className="font-medium text-gray-900">{formatCurrency(order.sale_amount)}</span>
            </div>
            {order.estimated_closing_date && (
              <div className="flex justify-between">
                <span className="text-gray-600">Est. Closing Date:</span>
                <span className="font-medium text-gray-900">
                  {new Date(order.estimated_closing_date).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="text-gray-900">{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            {order.completed_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="text-gray-900">
                  {new Date(order.completed_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          {order.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 font-medium">Order Notes:</p>
              <p className="text-gray-600 mt-1">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Timeline */}
      <OrderTimeline
        orderId={orderId}
        orderCreatedAt={order.created_at}
        orderStatus={order.status}
        orderCompletedAt={order.completed_at}
        assignedAttorney={order.assigned_attorney}
      />

      {/* Activity / Notes - Admin/Law Firm/Attorney Only */}
      {(isAdmin || isLawFirm || profile?.role === 'attorney') && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare size={20} />
            Activity & Notes
          </h2>

          {/* Add Note Form */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between mt-3">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={isInternalNote}
                  onChange={(e) => setIsInternalNote(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Internal note (not visible to customer)
              </label>
              <button
                onClick={addNote}
                disabled={addingNote || !newNote.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={16} />
                Add Note
              </button>
            </div>
          </div>

          {/* Notes List */}
          {order.order_notes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No notes yet</p>
          ) : (
            <div className="space-y-4">
              {order.order_notes
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((note) => (
                  <div
                    key={note.id}
                    className={`p-4 rounded-lg border ${
                      note.is_internal ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {note.author?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleString()}
                          {note.is_internal && (
                            <span className="ml-2 text-yellow-600 font-medium">Internal</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-600">{note.note}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Notes Section - only for admins */}
      {isAdmin && (
        <AdminNotes entityType="order" entityId={orderId} />
      )}
    </div>
  )
}

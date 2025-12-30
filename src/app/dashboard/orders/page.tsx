'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { Search, Eye, Calendar, DollarSign, MapPin } from 'lucide-react'
import type { OrderStatus } from '@/types'

interface OrderWithDetails {
  id: string
  order_number: string
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
  customer_id: string
  law_firm_id: string
  assigned_attorney_id: string | null
  law_firms: { id: string; name: string } | null
  assigned_attorney: { id: string; profiles: { full_name: string } | null } | null
}

function OrdersContent() {
  const { profile, user } = useAuth()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [updating, setUpdating] = useState<string | null>(null)

  const isAdmin = profile?.role === 'admin'
  const isLawFirm = profile?.role === 'law_firm' || profile?.profile_type === 'law_firm'
  const isAttorney = profile?.role === 'attorney'

  useEffect(() => {
    fetchOrders()
  }, [profile, user])

  async function fetchOrders() {
    if (!user || !profile) return

    const supabase = createClient()
    let query = supabase
      .from('orders')
      .select(`
        *,
        law_firms(id, name),
        assigned_attorney:attorneys(id, profiles(full_name))
      `)
      .order('created_at', { ascending: false })

    // Filter based on role
    if (!isAdmin) {
      if (isLawFirm) {
        // Get the law firm owned by this user
        const { data: lawFirmData } = await supabase
          .from('law_firms')
          .select('id')
          .eq('owner_id', user.id)
          .single()

        if (lawFirmData) {
          query = query.eq('law_firm_id', lawFirmData.id)
        }
      } else if (isAttorney) {
        // Get attorney record
        const { data: attorneyData } = await supabase
          .from('attorneys')
          .select('id')
          .eq('profile_id', user.id)
          .single()

        if (attorneyData) {
          query = query.eq('assigned_attorney_id', attorneyData.id)
        }
      } else {
        // Customer - show their orders
        query = query.eq('customer_id', user.id)
      }
    }

    const { data, error } = await query

    if (!error && data) {
      setOrders(data as OrderWithDetails[])
    }
    setLoading(false)
  }

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!isAdmin && !isLawFirm) return

    setUpdating(orderId)
    const supabase = createClient()

    const updateData: { status: OrderStatus; completed_at?: string | null } = { status: newStatus }
    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else {
      updateData.completed_at = null
    }

    const { error } = await supabase.from('orders').update(updateData).eq('id', orderId)

    if (!error) {
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
    }
    setUpdating(null)
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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchTerm === '' ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.property_city.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const getPageTitle = () => {
    if (isAdmin) return 'All Orders'
    if (isLawFirm) return 'Pipeline'
    if (isAttorney) return 'My Assigned Orders'
    return 'My Orders'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
        <p className="text-sm text-gray-500">{orders.length} total orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by order #, customer, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Order</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Property</th>
                  {isAdmin && (
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Law Firm</th>
                  )}
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.order_number}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">{order.customer_email}</p>
                      <p className="text-xs text-gray-400 capitalize">{order.customer_role.replace('_', ' ')}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p className="flex items-center gap-1 text-gray-900">
                        <MapPin size={12} className="text-gray-400" />
                        {order.property_city}, {order.property_state}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {order.closing_type} &bull; {order.property_type}
                      </p>
                      {order.estimated_closing_date && (
                        <p className="text-xs text-blue-600">
                          Est. close: {new Date(order.estimated_closing_date).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-sm">
                        <p className="text-gray-900">{order.law_firms?.name || 'Unknown'}</p>
                        {order.assigned_attorney?.profiles && (
                          <p className="text-xs text-purple-600">
                            Assigned: {order.assigned_attorney.profiles.full_name}
                          </p>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm">
                      <p className="flex items-center gap-1 text-gray-900">
                        <DollarSign size={12} className="text-gray-400" />
                        {formatCurrency(order.sale_amount)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin || isLawFirm ? (
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          disabled={updating === order.id}
                          className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${getStatusBadgeColor(order.status)}`}
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded inline-flex"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
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

export default function DashboardOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  )
}

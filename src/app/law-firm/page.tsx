'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { FileText, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react'

interface OrderStats {
  total: number
  new: number
  in_progress: number
  completed: number
}

interface RecentOrder {
  id: string
  order_number: string
  status: string
  property_street: string
  property_city: string
  property_state: string
  closing_type: string
  estimated_closing_date: string | null
  created_at: string
  customer: { full_name: string; email: string } | null
  assigned_attorney: { id: string; full_name: string } | null
}

export default function LawFirmDashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    new: 0,
    in_progress: 0,
    completed: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [lawFirmId, setLawFirmId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const userId = user.id

    async function fetchDashboardData() {
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

      setLawFirmId(lawFirm.id)

      // Fetch all orders for stats
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status')
        .eq('law_firm_id', lawFirm.id)

      if (orders) {
        setStats({
          total: orders.length,
          new: orders.filter((o: { status: string }) => o.status === 'new').length,
          in_progress: orders.filter((o: { status: string }) => o.status === 'in_progress').length,
          completed: orders.filter((o: { status: string }) => o.status === 'completed').length,
        })
      }

      // Fetch recent orders with customer and attorney info
      const { data: recent } = await supabase
        .from('orders')
        .select(
          `
          id, order_number, status, property_street, property_city, property_state,
          closing_type, estimated_closing_date, created_at,
          customer:profiles!orders_customer_id_fkey (full_name, email),
          assigned_attorney:profiles!orders_assigned_attorney_id_fkey (id, full_name)
        `
        )
        .eq('law_firm_id', lawFirm.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (recent) {
        setRecentOrders(recent as RecentOrder[])
      }

      setLoading(false)
    }

    fetchDashboardData()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!lawFirmId) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-600">No law firm found for this account.</p>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Orders', value: stats.total, icon: FileText, color: 'bg-blue-500' },
    { label: 'New', value: stats.new, icon: AlertCircle, color: 'bg-yellow-500' },
    { label: 'In Progress', value: stats.in_progress, icon: Clock, color: 'bg-blue-500' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'bg-green-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <Icon className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/law-firm/orders" className="text-blue-600 hover:underline text-sm">
            View All Orders
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-600">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                    Order #
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                    Property
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                    Attorney
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                    Closing Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/law-firm/orders/${order.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.customer?.full_name || order.customer?.email || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.property_city}, {order.property_state}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {order.closing_type}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.assigned_attorney?.full_name || (
                        <span className="text-yellow-600">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'new'
                            ? 'bg-yellow-100 text-yellow-800'
                            : order.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.estimated_closing_date
                        ? new Date(order.estimated_closing_date).toLocaleDateString()
                        : '-'}
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

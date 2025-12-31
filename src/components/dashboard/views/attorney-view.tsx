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

interface Order {
  id: string
  order_number: string
  status: string
  customer_name: string
  customer_phone: string
  customer_email: string
  property_street: string
  property_city: string
  property_state: string
  property_zip: string
  closing_type: string
  estimated_closing_date: string | null
  sale_amount: number | null
  created_at: string
}

export function AttorneyView() {
  const { user } = useAuth()
  const [attorneyId, setAttorneyId] = useState<string | null>(null)
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    new: 0,
    in_progress: 0,
    completed: 0,
  })
  const [orders, setOrders] = useState<Order[]>([])
  const [upcomingClosings, setUpcomingClosings] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchOrders(attId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('assigned_attorney_id', attId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return
    }

    if (data) {
      setStats({
        total: data.length,
        new: data.filter((o: Order) => o.status === 'new').length,
        in_progress: data.filter((o: Order) => o.status === 'in_progress').length,
        completed: data.filter((o: Order) => o.status === 'completed').length,
      })
      setOrders(data.slice(0, 10))

      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      const upcoming = data
        .filter((o: Order) => {
          if (!o.estimated_closing_date) return false
          const closeDate = new Date(o.estimated_closing_date)
          return closeDate >= today && closeDate <= nextWeek && o.status !== 'completed'
        })
        .sort(
          (a: Order, b: Order) =>
            new Date(a.estimated_closing_date!).getTime() -
            new Date(b.estimated_closing_date!).getTime()
        )
      setUpcomingClosings(upcoming)
    }
  }

  useEffect(() => {
    if (!user) return

    const userId = user.id

    async function init() {
      const supabase = createClient()

      const { data: attorney } = await supabase
        .from('attorneys')
        .select('id')
        .eq('profile_id', userId)
        .single()

      if (!attorney) {
        setLoading(false)
        return
      }

      setAttorneyId(attorney.id)
      await fetchOrders(attorney.id)
      setLoading(false)

      const subscription = supabase
        .channel('attorney-orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `assigned_attorney_id=eq.${attorney.id}`,
          },
          () => {
            fetchOrders(attorney.id)
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }

    init()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const statCards = [
    { label: 'Assigned Orders', value: stats.total, icon: FileText, color: 'bg-green-500' },
    { label: 'New', value: stats.new, icon: AlertCircle, color: 'bg-yellow-500' },
    { label: 'In Progress', value: stats.in_progress, icon: Clock, color: 'bg-blue-500' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'bg-green-600' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>

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

      {upcomingClosings.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="text-blue-600" size={24} />
            <h3 className="font-medium text-blue-800">
              Upcoming Closings This Week ({upcomingClosings.length})
            </h3>
          </div>
          <div className="space-y-2">
            {upcomingClosings.slice(0, 3).map((order) => (
              <Link
                key={order.id}
                href={`/transaction/${order.id}`}
                className="block bg-white p-3 rounded border hover:border-blue-300"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{order.order_number}</p>
                    <p className="text-sm text-gray-600">
                      {order.property_city}, {order.property_state} - {order.customer_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">
                      {new Date(order.estimated_closing_date!).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{order.closing_type}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">My Assigned Orders</h2>
          <Link href="/dashboard/orders" className="text-green-600 hover:underline text-sm">
            View All
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-600">No orders assigned to you yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Orders will appear here when assigned by your firm
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Order #</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Property</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Closing Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/transaction/${order.id}`}
                        className="text-green-600 hover:underline font-medium"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">{order.customer_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.property_city}, {order.property_state}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.estimated_closing_date
                        ? new Date(order.estimated_closing_date).toLocaleDateString()
                        : '-'}
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
                    <td className="px-4 py-3">
                      <Link
                        href={`/transaction/${order.id}`}
                        className="text-green-600 hover:underline text-sm"
                      >
                        View
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

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { FileText, Clock, CheckCircle, AlertCircle, Calendar, ClipboardList } from 'lucide-react'

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
  property_city: string
  property_state: string
  closing_type: string
  customer_name: string
  estimated_closing_date: string | null
  created_at: string
  law_firms: { name: string } | null
}

export function ClosingCoordinatorView() {
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    new: 0,
    in_progress: 0,
    completed: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [upcomingClosings, setUpcomingClosings] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const userId = user.id

    async function fetchDashboardData() {
      const supabase = createClient()

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          property_city,
          property_state,
          closing_type,
          customer_name,
          estimated_closing_date,
          created_at,
          law_firms (name)
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        setLoading(false)
        return
      }

      if (orders) {
        setStats({
          total: orders.length,
          new: orders.filter((o: { status: string }) => o.status === 'new').length,
          in_progress: orders.filter((o: { status: string }) => o.status === 'in_progress').length,
          completed: orders.filter((o: { status: string }) => o.status === 'completed').length,
        })
        setRecentOrders(orders.slice(0, 5) as RecentOrder[])

        const today = new Date()
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        const upcoming = orders
          .filter((o: RecentOrder) => {
            if (!o.estimated_closing_date) return false
            const closeDate = new Date(o.estimated_closing_date)
            return closeDate >= today && closeDate <= nextWeek && o.status !== 'completed'
          })
          .sort(
            (a: RecentOrder, b: RecentOrder) =>
              new Date(a.estimated_closing_date!).getTime() -
              new Date(b.estimated_closing_date!).getTime()
          )
        setUpcomingClosings(upcoming.slice(0, 3) as RecentOrder[])
      }

      setLoading(false)
    }

    fetchDashboardData()
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Transactions', value: stats.total, icon: FileText, color: 'bg-teal-500' },
    { label: 'New', value: stats.new, icon: AlertCircle, color: 'bg-yellow-500' },
    { label: 'In Progress', value: stats.in_progress, icon: Clock, color: 'bg-blue-600' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'bg-green-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Coordinator Dashboard</h1>
      </div>

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
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="text-teal-600" size={24} />
            <h3 className="font-medium text-teal-800">
              Upcoming Closings This Week ({upcomingClosings.length})
            </h3>
          </div>
          <div className="space-y-2">
            {upcomingClosings.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/transactions/${order.id}`}
                className="block bg-white p-3 rounded border hover:border-teal-300"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{order.order_number}</p>
                    <p className="text-sm text-gray-600">
                      {order.property_city}, {order.property_state} - {order.customer_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-teal-600">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/calendar"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="bg-teal-100 p-3 rounded-lg">
            <Calendar className="text-teal-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">View Calendar</h3>
            <p className="text-sm text-gray-600">See all scheduled closings</p>
          </div>
        </Link>
        <Link
          href="/dashboard/tasks"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="bg-blue-100 p-3 rounded-lg">
            <ClipboardList className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Task List</h3>
            <p className="text-sm text-gray-600">Manage closing tasks and paperwork</p>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <Link href="/dashboard/transactions" className="text-teal-600 hover:underline text-sm">
            View All
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-600 mb-4">No transactions yet</p>
            <Link
              href="/search"
              className="inline-block bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
            >
              Schedule Your First Closing
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Order #</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Client</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Property</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Closing Date</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/transactions/${order.id}`}
                        className="text-teal-600 hover:underline font-medium"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.customer_name}
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

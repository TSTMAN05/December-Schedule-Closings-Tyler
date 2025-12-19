'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'

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
  created_at: string
  law_firm: { name: string } | null
}

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    new: 0,
    in_progress: 0,
    completed: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const userId = user.id

    async function fetchDashboardData() {
      const supabase = createClient()

      // Fetch all orders for stats
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status')
        .eq('customer_id', userId)

      if (orders) {
        setStats({
          total: orders.length,
          new: orders.filter((o: { status: string }) => o.status === 'new').length,
          in_progress: orders.filter((o: { status: string }) => o.status === 'in_progress').length,
          completed: orders.filter((o: { status: string }) => o.status === 'completed').length,
        })
      }

      // Fetch recent orders
      const { data: recent } = await supabase
        .from('orders')
        .select(
          `
          id, order_number, status, property_city, property_state, created_at,
          law_firm:law_firms (name)
        `
        )
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

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

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/customer/orders" className="text-blue-600 hover:underline text-sm">
            View All
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-600 mb-4">No orders yet</p>
            <Link
              href="/search"
              className="inline-block bg-brand-blue text-white px-4 py-2 rounded-md hover:bg-brand-blue-light transition-colors"
            >
              Schedule Your First Closing
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/customer/orders/${order.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{order.order_number}</p>
                  <p className="text-sm text-gray-600">
                    {order.law_firm?.name} • {order.property_city}, {order.property_state}
                  </p>
                </div>
                <div className="text-right">
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
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

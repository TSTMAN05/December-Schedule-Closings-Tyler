'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { FileText, Clock, CheckCircle, AlertCircle, Users, Building2, Plus } from 'lucide-react'

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

export function RealEstateAgentView() {
  const { user, isLoading: authLoading } = useAuth()
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
    { label: 'Total Transactions', value: stats.total, icon: FileText, color: 'bg-green-500' },
    { label: 'New', value: stats.new, icon: AlertCircle, color: 'bg-yellow-500' },
    { label: 'In Progress', value: stats.in_progress, icon: Clock, color: 'bg-blue-600' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'bg-green-600' },
  ]

  const quickActions = [
    { label: 'Schedule Closing', href: '/search', icon: Plus, color: 'bg-green-600' },
    { label: 'View Clients', href: '/dashboard/clients', icon: Users, color: 'bg-blue-600' },
    { label: 'Find Law Firms', href: '/search', icon: Building2, color: 'bg-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
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

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.label}
                href={action.href}
                className={`${action.color} text-white p-4 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-3`}
              >
                <Icon size={24} />
                <span className="font-medium">{action.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <Link href="/dashboard/transactions" className="text-green-600 hover:underline text-sm">
            View All
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-600 mb-4">No transactions yet</p>
            <Link
              href="/search"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
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
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Law Firm</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/transactions/${order.id}`}
                        className="text-green-600 hover:underline font-medium"
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
                      {order.law_firms?.name || '-'}
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

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { FileText, Clock, CheckCircle, AlertCircle, DollarSign, Building2, TrendingUp } from 'lucide-react'

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
  sale_amount: number | null
  estimated_closing_date: string | null
  created_at: string
  law_firms: { name: string } | null
}

export function LenderView() {
  const { user, profile, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    new: 0,
    in_progress: 0,
    completed: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [totalLoanValue, setTotalLoanValue] = useState(0)
  const [loading, setLoading] = useState(true)

  const isLoanProcessor = profile?.profile_type === 'loan_processor'
  const dashboardTitle = isLoanProcessor ? 'Loan Processor Dashboard' : 'Loan Officer Dashboard'

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
          sale_amount,
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

        const total = orders.reduce((sum: number, order: { sale_amount: number | null }) => {
          return sum + (order.sale_amount || 0)
        }, 0)
        setTotalLoanValue(total)
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
    { label: 'Total Loans', value: stats.total, icon: FileText, color: 'bg-amber-500' },
    { label: 'Pending', value: stats.new, icon: AlertCircle, color: 'bg-yellow-500' },
    { label: 'In Progress', value: stats.in_progress, icon: Clock, color: 'bg-blue-600' },
    { label: 'Closed', value: stats.completed, icon: CheckCircle, color: 'bg-green-600' },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{dashboardTitle}</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={24} />
            <span className="text-lg font-medium">Total Loan Volume</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totalLoanValue)}</p>
          <p className="text-amber-100 text-sm mt-1">Across all transactions</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={24} className="text-green-600" />
            <span className="text-lg font-medium text-gray-900">Completion Rate</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
          </p>
          <p className="text-gray-500 text-sm mt-1">{stats.completed} of {stats.total} loans closed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/loans"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="bg-amber-100 p-3 rounded-lg">
            <DollarSign className="text-amber-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">View All Loans</h3>
            <p className="text-sm text-gray-600">Manage your loan pipeline</p>
          </div>
        </Link>
        <Link
          href="/search"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow flex items-center gap-4"
        >
          <div className="bg-blue-100 p-3 rounded-lg">
            <Building2 className="text-blue-600" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Find Law Firms</h3>
            <p className="text-sm text-gray-600">Schedule a new closing</p>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Loans</h2>
          <Link href="/dashboard/loans" className="text-amber-600 hover:underline text-sm">
            View All
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-600 mb-4">No loans yet</p>
            <Link
              href="/search"
              className="inline-block bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
            >
              Schedule Your First Closing
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Loan #</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Borrower</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Property</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/loans/${order.id}`}
                        className="text-amber-600 hover:underline font-medium"
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
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {order.sale_amount ? formatCurrency(order.sale_amount) : '-'}
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

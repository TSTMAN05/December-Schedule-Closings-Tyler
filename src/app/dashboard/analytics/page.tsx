'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import {
  BarChart3,
  TrendingUp,
  Clock,
  MapPin,
  Building,
  FileText,
  Users,
  Calendar,
} from 'lucide-react'

interface AnalyticsData {
  // Order metrics
  ordersThisWeek: number
  ordersLastWeek: number
  ordersThisMonth: number
  ordersLastMonth: number

  // State breakdown
  ordersByState: { state: string; count: number }[]

  // Closing type breakdown
  ordersByClosingType: { type: string; count: number }[]

  // Firm metrics
  activeFirms: number
  inactiveFirms: number
  avgOrdersPerFirm: number

  // Timing metrics
  avgDaysToAssignment: number
  avgDaysToCompletion: number

  // User metrics
  totalCustomers: number
  totalAttorneys: number
  newUsersThisWeek: number
}

export default function DashboardAnalyticsPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    if (profile && !isAdmin) {
      router.push('/dashboard')
      return
    }
    if (isAdmin) {
      fetchAnalytics()
    }
  }, [profile, isAdmin, router])

  async function fetchAnalytics() {
    const supabase = createClient()
    const now = new Date()

    // Date ranges
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfLastWeek = new Date(startOfWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const [
      ordersThisWeek,
      ordersLastWeek,
      ordersThisMonth,
      ordersLastMonth,
      allOrders,
      activeFirmsResult,
      inactiveFirmsResult,
      totalCustomersResult,
      totalAttorneysResult,
      newUsersResult,
      completedOrders,
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfWeek.toISOString()),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfLastWeek.toISOString())
        .lt('created_at', startOfWeek.toISOString()),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfLastMonth.toISOString())
        .lt('created_at', endOfLastMonth.toISOString()),
      supabase
        .from('orders')
        .select('property_state, closing_type'),
      supabase
        .from('law_firms')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('law_firms')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'inactive'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'customer'),
      supabase
        .from('attorneys')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfWeek.toISOString()),
      supabase
        .from('orders')
        .select('created_at, completed_at')
        .eq('status', 'completed')
        .not('completed_at', 'is', null),
    ])

    // Calculate state breakdown
    const stateMap = new Map<string, number>()
    const closingTypeMap = new Map<string, number>()

    ;(allOrders.data || []).forEach((order: { property_state: string; closing_type: string }) => {
      stateMap.set(order.property_state, (stateMap.get(order.property_state) || 0) + 1)
      closingTypeMap.set(order.closing_type, (closingTypeMap.get(order.closing_type) || 0) + 1)
    })

    const ordersByState = Array.from(stateMap.entries())
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const ordersByClosingType = Array.from(closingTypeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)

    // Calculate average days to completion
    let totalDaysToCompletion = 0
    let completedCount = 0

    ;(completedOrders.data || []).forEach((order: { created_at: string; completed_at: string }) => {
      if (order.completed_at) {
        const created = new Date(order.created_at)
        const completed = new Date(order.completed_at)
        const days = Math.floor((completed.getTime() - created.getTime()) / (24 * 60 * 60 * 1000))
        totalDaysToCompletion += days
        completedCount++
      }
    })

    const activeFirmsCount = activeFirmsResult.count || 0
    const totalOrdersCount = (allOrders.data || []).length

    setData({
      ordersThisWeek: ordersThisWeek.count || 0,
      ordersLastWeek: ordersLastWeek.count || 0,
      ordersThisMonth: ordersThisMonth.count || 0,
      ordersLastMonth: ordersLastMonth.count || 0,
      ordersByState,
      ordersByClosingType,
      activeFirms: activeFirmsCount,
      inactiveFirms: inactiveFirmsResult.count || 0,
      avgOrdersPerFirm: activeFirmsCount > 0 ? Math.round(totalOrdersCount / activeFirmsCount * 10) / 10 : 0,
      avgDaysToAssignment: 0, // Would need assignment timestamp to calculate
      avgDaysToCompletion: completedCount > 0 ? Math.round(totalDaysToCompletion / completedCount) : 0,
      totalCustomers: totalCustomersResult.count || 0,
      totalAttorneys: totalAttorneysResult.count || 0,
      newUsersThisWeek: newUsersResult.count || 0,
    })

    setLoading(false)
  }

  if (!isAdmin) {
    return null
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  const weekOverWeekChange = data.ordersLastWeek > 0
    ? Math.round(((data.ordersThisWeek - data.ordersLastWeek) / data.ordersLastWeek) * 100)
    : data.ordersThisWeek > 0 ? 100 : 0

  const monthOverMonthChange = data.ordersLastMonth > 0
    ? Math.round(((data.ordersThisMonth - data.ordersLastMonth) / data.ordersLastMonth) * 100)
    : data.ordersThisMonth > 0 ? 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 size={28} />
          Platform Analytics
        </h1>
        <p className="text-sm text-gray-500">Platform diagnostics and metrics</p>
      </div>

      {/* Order Velocity */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Orders This Week</p>
              <p className="text-2xl font-bold text-gray-900">{data.ordersThisWeek}</p>
            </div>
            <div className={`text-sm font-medium ${weekOverWeekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {weekOverWeekChange >= 0 ? '+' : ''}{weekOverWeekChange}%
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">vs {data.ordersLastWeek} last week</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Orders This Month</p>
              <p className="text-2xl font-bold text-gray-900">{data.ordersThisMonth}</p>
            </div>
            <div className={`text-sm font-medium ${monthOverMonthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthOverMonthChange >= 0 ? '+' : ''}{monthOverMonthChange}%
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">vs {data.ordersLastMonth} last month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Clock className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg. Days to Complete</p>
              <p className="text-2xl font-bold text-gray-900">{data.avgDaysToCompletion}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Orders per Firm</p>
              <p className="text-2xl font-bold text-gray-900">{data.avgOrdersPerFirm}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Geographic and Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by State */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center gap-2">
            <MapPin size={20} className="text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Orders by State</h2>
          </div>
          <div className="p-4">
            {data.ordersByState.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No order data</p>
            ) : (
              <div className="space-y-3">
                {data.ordersByState.map((item) => {
                  const maxCount = data.ordersByState[0]?.count || 1
                  const percentage = Math.round((item.count / maxCount) * 100)
                  return (
                    <div key={item.state}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-900">{item.state}</span>
                        <span className="text-gray-600">{item.count} orders</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Orders by Closing Type */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center gap-2">
            <FileText size={20} className="text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Orders by Closing Type</h2>
          </div>
          <div className="p-4">
            {data.ordersByClosingType.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No order data</p>
            ) : (
              <div className="space-y-3">
                {data.ordersByClosingType.map((item) => {
                  const total = data.ordersByClosingType.reduce((sum, i) => sum + i.count, 0)
                  const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0
                  return (
                    <div key={item.type}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-900 capitalize">{item.type}</span>
                        <span className="text-gray-600">{item.count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Entity Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Firms</p>
              <p className="text-2xl font-bold text-gray-900">{data.activeFirms}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{data.inactiveFirms} inactive</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Users className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Customers</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalCustomers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Users className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Attorneys</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalAttorneys}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Calendar className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">New Users (Week)</p>
              <p className="text-2xl font-bold text-gray-900">{data.newUsersThisWeek}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui'
import {
  Building,
  Users,
  FileText,
  AlertCircle,
  TrendingUp,
  Clock,
  AlertTriangle,
  UserX,
  CheckCircle,
} from 'lucide-react'

interface Stats {
  totalFirms: number
  pendingFirms: number
  activeFirms: number
  inactiveFirms: number
  totalUsers: number
  totalOrders: number
  newOrders: number
  inProgressOrders: number
  completedOrders: number
  cancelledOrders: number
}

interface OrderHealthFlag {
  id: string
  order_number: string
  customer_name: string
  status: string
  created_at: string
  days_old: number
  issue: 'stuck_new' | 'stuck_in_progress' | 'unassigned'
  law_firms: { name: string } | null
}

interface RecentOrder {
  id: string
  order_number: string
  status: string
  customer_name: string
  created_at: string
  law_firms: { name: string } | null
}

interface PendingFirm {
  id: string
  name: string
  email: string
  created_at: string
}

const STUCK_NEW_DAYS = 3
const STUCK_IN_PROGRESS_DAYS = 14

export function AdminView() {
  const [stats, setStats] = useState<Stats>({
    totalFirms: 0,
    pendingFirms: 0,
    activeFirms: 0,
    inactiveFirms: 0,
    totalUsers: 0,
    totalOrders: 0,
    newOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [pendingFirms, setPendingFirms] = useState<PendingFirm[]>([])
  const [healthFlags, setHealthFlags] = useState<OrderHealthFlag[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchDashboardData() {
    const supabase = createClient()

    const now = new Date()
    const stuckNewDate = new Date(now.getTime() - STUCK_NEW_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const stuckInProgressDate = new Date(now.getTime() - STUCK_IN_PROGRESS_DAYS * 24 * 60 * 60 * 1000).toISOString()

    const [
      firms,
      pending,
      active,
      inactive,
      users,
      orders,
      newOrds,
      inProgress,
      completed,
      cancelled,
      recentOrd,
      pendingF,
      stuckNew,
      stuckInProg,
      unassigned,
    ] = await Promise.all([
      supabase.from('law_firms').select('id', { count: 'exact', head: true }),
      supabase.from('law_firms').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('law_firms').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('law_firms').select('id', { count: 'exact', head: true }).eq('status', 'inactive'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
      supabase
        .from('orders')
        .select('id, order_number, status, customer_name, created_at, law_firms(name)')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('law_firms')
        .select('id, name, email, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5),
      // Orders stuck in 'new' status for > X days
      supabase
        .from('orders')
        .select('id, order_number, status, customer_name, created_at, law_firms(name)')
        .eq('status', 'new')
        .lt('created_at', stuckNewDate)
        .order('created_at', { ascending: true })
        .limit(10),
      // Orders stuck in 'in_progress' for > X days
      supabase
        .from('orders')
        .select('id, order_number, status, customer_name, created_at, law_firms(name)')
        .eq('status', 'in_progress')
        .lt('created_at', stuckInProgressDate)
        .order('created_at', { ascending: true })
        .limit(10),
      // Orders with no assigned attorney
      supabase
        .from('orders')
        .select('id, order_number, status, customer_name, created_at, law_firms(name)')
        .in('status', ['new', 'in_progress'])
        .is('assigned_attorney_id', null)
        .order('created_at', { ascending: true })
        .limit(10),
    ])

    setStats({
      totalFirms: firms.count || 0,
      pendingFirms: pending.count || 0,
      activeFirms: active.count || 0,
      inactiveFirms: inactive.count || 0,
      totalUsers: users.count || 0,
      totalOrders: orders.count || 0,
      newOrders: newOrds.count || 0,
      inProgressOrders: inProgress.count || 0,
      completedOrders: completed.count || 0,
      cancelledOrders: cancelled.count || 0,
    })
    setRecentOrders((recentOrd.data as RecentOrder[]) || [])
    setPendingFirms((pendingF.data as PendingFirm[]) || [])

    // Compile health flags
    const flags: OrderHealthFlag[] = []
    const addedIds = new Set<string>()

    ;(stuckNew.data || []).forEach((order: RecentOrder) => {
      if (!addedIds.has(order.id)) {
        const daysOld = Math.floor((now.getTime() - new Date(order.created_at).getTime()) / (24 * 60 * 60 * 1000))
        flags.push({ ...order, days_old: daysOld, issue: 'stuck_new' } as OrderHealthFlag)
        addedIds.add(order.id)
      }
    })

    ;(stuckInProg.data || []).forEach((order: RecentOrder) => {
      if (!addedIds.has(order.id)) {
        const daysOld = Math.floor((now.getTime() - new Date(order.created_at).getTime()) / (24 * 60 * 60 * 1000))
        flags.push({ ...order, days_old: daysOld, issue: 'stuck_in_progress' } as OrderHealthFlag)
        addedIds.add(order.id)
      }
    })

    ;(unassigned.data || []).forEach((order: RecentOrder) => {
      if (!addedIds.has(order.id)) {
        const daysOld = Math.floor((now.getTime() - new Date(order.created_at).getTime()) / (24 * 60 * 60 * 1000))
        flags.push({ ...order, days_old: daysOld, issue: 'unassigned' } as OrderHealthFlag)
        addedIds.add(order.id)
      }
    })

    setHealthFlags(flags)
    setLoading(false)
  }

  useEffect(() => {
    fetchDashboardData()

    const supabase = createClient()

    const ordersSubscription = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchDashboardData()
      })
      .subscribe()

    const firmsSubscription = supabase
      .channel('admin-firms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'law_firms' }, () => {
        fetchDashboardData()
      })
      .subscribe()

    return () => {
      ordersSubscription.unsubscribe()
      firmsSubscription.unsubscribe()
    }
  }, [])

  const getHealthFlagLabel = (issue: OrderHealthFlag['issue']) => {
    switch (issue) {
      case 'stuck_new':
        return { label: 'Stuck in New', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
      case 'stuck_in_progress':
        return { label: 'Long In Progress', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle }
      case 'unassigned':
        return { label: 'No Attorney', color: 'bg-red-100 text-red-800', icon: UserX }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {(stats.pendingFirms > 0 || healthFlags.length > 0) && (
        <div className="space-y-3">
          {stats.pendingFirms > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-yellow-600" size={24} />
                <div>
                  <p className="font-medium text-yellow-800">
                    {stats.pendingFirms} law firm{stats.pendingFirms > 1 ? 's' : ''} pending approval
                  </p>
                  <p className="text-sm text-yellow-600">Review and approve to make them visible</p>
                </div>
              </div>
              <Link
                href="/dashboard/law-firms?status=pending"
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 text-sm"
              >
                Review Now
              </Link>
            </div>
          )}

          {healthFlags.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="text-red-600" size={24} />
                <div>
                  <p className="font-medium text-red-800">
                    {healthFlags.length} order{healthFlags.length > 1 ? 's' : ''} need attention
                  </p>
                  <p className="text-sm text-red-600">Orders that may be stuck or missing assignments</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/law-firms" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Building className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFirms}</p>
              <p className="text-sm text-gray-600">Law Firms</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span className="text-green-600">{stats.activeFirms} active</span>
            {stats.pendingFirms > 0 && <span className="text-yellow-600 ml-2">{stats.pendingFirms} pending</span>}
          </div>
        </Link>

        <Link href="/dashboard/users" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <Users className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-sm text-gray-600">Users</p>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/orders" className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 p-2 rounded-lg">
              <FileText className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-sm text-gray-600">Orders</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span className="text-yellow-600">{stats.newOrders} new</span>
            <span className="text-blue-600 ml-2">{stats.inProgressOrders} active</span>
          </div>
        </Link>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <TrendingUp className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalOrders > 0
                  ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
                  : 0}
                %
              </p>
              <p className="text-sm text-gray-600">Completion</p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span className="text-green-600">{stats.completedOrders} completed</span>
          </div>
        </div>
      </div>

      {/* Health Flags Section */}
      {healthFlags.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              Orders Needing Attention
            </h2>
            <span className="text-sm text-gray-500">{healthFlags.length} issues</span>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {healthFlags.map((order) => {
              const flagInfo = getHealthFlagLabel(order.issue)
              const FlagIcon = flagInfo.icon
              return (
                <Link
                  key={order.id}
                  href={`/transaction/${order.id}`}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FlagIcon size={18} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{order.order_number}</p>
                      <p className="text-sm text-gray-500">
                        {order.customer_name} - {order.law_firms?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{order.days_old}d old</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${flagInfo.color}`}>
                      {flagInfo.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
            <Link
              href="/dashboard/law-firms?status=pending"
              className="text-blue-600 hover:underline text-sm"
            >
              View All
            </Link>
          </div>
          {pendingFirms.length === 0 ? (
            <div className="p-6 text-center text-gray-500 flex flex-col items-center gap-2">
              <CheckCircle className="text-green-500" size={24} />
              <p>No pending approvals</p>
            </div>
          ) : (
            <div className="divide-y">
              {pendingFirms.map((firm) => (
                <Link
                  key={firm.id}
                  href={`/dashboard/law-firms/${firm.id}`}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{firm.name}</p>
                    <p className="text-sm text-gray-500">{firm.email}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(firm.created_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-blue-600 hover:underline text-sm">
              View All
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No orders yet</div>
          ) : (
            <div className="divide-y">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/transaction/${order.id}`}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{order.order_number}</p>
                    <p className="text-sm text-gray-500">
                      {order.customer_name} - {order.law_firms?.name || 'Unknown Firm'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
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
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui'
import { Building, Users, FileText, AlertCircle } from 'lucide-react'

interface Stats {
  totalFirms: number
  pendingFirms: number
  totalUsers: number
  totalOrders: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalFirms: 0,
    pendingFirms: 0,
    totalUsers: 0,
    totalOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient()

      const [firms, pendingFirms, users, orders] = await Promise.all([
        supabase.from('law_firms').select('id', { count: 'exact', head: true }),
        supabase.from('law_firms').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
      ])

      setStats({
        totalFirms: firms.count || 0,
        pendingFirms: pendingFirms.count || 0,
        totalUsers: users.count || 0,
        totalOrders: orders.count || 0,
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Pending Approvals Alert */}
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
            href="/admin/law-firms?status=pending"
            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 text-sm"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Building className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFirms}</p>
              <p className="text-sm text-gray-600">Law Firms</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <Building className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingFirms}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <Users className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-sm text-gray-600">Users</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 p-2 rounded-lg">
              <FileText className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-sm text-gray-600">Orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

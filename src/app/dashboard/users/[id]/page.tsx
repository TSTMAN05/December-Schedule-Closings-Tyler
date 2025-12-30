'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { AdminNotes } from '@/components/admin'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Building,
  Briefcase,
  Calendar,
  Ban,
  CheckCircle,
} from 'lucide-react'
import type { UserRole, Profile } from '@/types'

interface UserDetail extends Profile {
  law_firms?: { id: string; name: string; status: string }[] | null
  attorneys?: { id: string; law_firm_id: string; is_active: boolean; law_firms: { id: string; name: string } }[] | null
}

export default function DashboardUserDetailPage() {
  const params = useParams()
  const { profile } = useAuth()
  const userId = params.id as string

  const isAdmin = profile?.role === 'admin'

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser()
  }, [userId])

  async function fetchUser() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        law_firms:law_firms!owner_id(id, name, status),
        attorneys(id, law_firm_id, is_active, law_firms(id, name))
      `)
      .eq('id', userId)
      .single()

    if (!error && data) {
      setUser(data as UserDetail)
    }
    setLoading(false)
  }

  const toggleUserDisabled = async () => {
    if (!isAdmin || !user) return

    const supabase = createClient()
    const currentlyDisabled = !!user.is_disabled
    const updateData = currentlyDisabled
      ? { is_disabled: false, disabled_at: null, disabled_reason: null }
      : { is_disabled: true, disabled_at: new Date().toISOString(), disabled_reason: 'Disabled by admin' }

    const { error } = await supabase.from('profiles').update(updateData).eq('id', userId)

    if (!error) {
      setUser({
        ...user,
        is_disabled: !currentlyDisabled,
        disabled_at: updateData.disabled_at,
        disabled_reason: updateData.disabled_reason,
      })
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield size={20} className="text-red-500" />
      case 'law_firm':
        return <Building size={20} className="text-blue-500" />
      case 'attorney':
        return <Briefcase size={20} className="text-purple-500" />
      default:
        return <User size={20} className="text-gray-500" />
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'law_firm':
        return 'bg-blue-100 text-blue-800'
      case 'attorney':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">User not found</p>
        <Link href="/dashboard/users" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Users
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/users"
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              {getRoleIcon(user.role)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
                {user.is_disabled && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
        {isAdmin && user.role !== 'admin' && (
          <button
            onClick={toggleUserDisabled}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
              user.is_disabled
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {user.is_disabled ? <CheckCircle size={16} /> : <Ban size={16} />}
            {user.is_disabled ? 'Enable User' : 'Disable User'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={20} />
            User Details
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail size={16} className="text-gray-400" />
              {user.email}
            </div>
            {user.phone && (
              <div className="flex items-center gap-3 text-gray-600">
                <Phone size={16} className="text-gray-400" />
                {user.phone}
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="text-gray-500">Role:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                {user.role.replace('_', ' ')}
              </span>
            </div>
            {user.profile_type && (
              <div className="flex items-center gap-3">
                <span className="text-gray-500">Profile Type:</span>
                <span className="text-gray-700 capitalize">{user.profile_type.replace('_', ' ')}</span>
              </div>
            )}
            {user.customer_type && (
              <div className="flex items-center gap-3">
                <span className="text-gray-500">Customer Type:</span>
                <span className="text-gray-700 capitalize">{user.customer_type.replace('_', ' ')}</span>
              </div>
            )}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar size={14} />
                Joined: {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Associations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building size={20} />
            Associations
          </h2>

          {/* Owned Law Firms */}
          {user.law_firms && user.law_firms.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Owned Law Firms</h3>
              <div className="space-y-2">
                {user.law_firms.map((firm) => (
                  <Link
                    key={firm.id}
                    href={`/dashboard/law-firms/${firm.id}`}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <span className="text-blue-700 font-medium">{firm.name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      firm.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {firm.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Attorney Associations */}
          {user.attorneys && user.attorneys.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Attorney At</h3>
              <div className="space-y-2">
                {user.attorneys.map((attorney) => (
                  <Link
                    key={attorney.id}
                    href={`/dashboard/law-firms/${attorney.law_firm_id}`}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100"
                  >
                    <span className="text-purple-700 font-medium">{attorney.law_firms?.name || 'Unknown Firm'}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      attorney.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {attorney.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(!user.law_firms || user.law_firms.length === 0) &&
           (!user.attorneys || user.attorneys.length === 0) && (
            <p className="text-gray-500">No associations</p>
          )}
        </div>

        {/* Disabled Status Info */}
        {user.is_disabled && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
              <Ban size={20} />
              Account Disabled
            </h2>
            <div className="space-y-2 text-sm text-red-700">
              {user.disabled_at && (
                <p>Disabled on: {new Date(user.disabled_at).toLocaleString()}</p>
              )}
              {user.disabled_reason && (
                <p>Reason: {user.disabled_reason}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin Notes Section */}
      {isAdmin && (
        <AdminNotes entityType="user" entityId={userId} />
      )}
    </div>
  )
}

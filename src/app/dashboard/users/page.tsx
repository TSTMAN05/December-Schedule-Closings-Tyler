'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { Search, Edit2, Shield, User, Building, Briefcase, X, Save, Ban, CheckCircle, Eye } from 'lucide-react'
import type { UserRole, Profile } from '@/types'

interface UserWithDetails extends Profile {
  law_firms?: { id: string; name: string }[] | null
  attorneys?: { id: string; law_firm_id: string; law_firms: { name: string } }[] | null
}

export default function DashboardUsersPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ full_name: string; role: UserRole; phone: string }>({
    full_name: '',
    role: 'customer',
    phone: '',
  })
  const [saving, setSaving] = useState(false)

  const isAdmin = profile?.role === 'admin'

  useEffect(() => {
    // Redirect non-admin users
    if (profile && profile.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    fetchUsers()
  }, [profile, router])

  async function fetchUsers() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        law_firms:law_firms!owner_id(id, name),
        attorneys(id, law_firm_id, law_firms(name))
      `)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setUsers(data as UserWithDetails[])
    }
    setLoading(false)
  }

  const startEdit = (user: UserWithDetails) => {
    setEditingUser(user.id)
    setEditForm({
      full_name: user.full_name,
      role: user.role,
      phone: user.phone || '',
    })
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setEditForm({ full_name: '', role: 'customer', phone: '' })
  }

  const saveUser = async (userId: string) => {
    if (!isAdmin) return

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editForm.full_name,
        role: editForm.role,
        phone: editForm.phone || null,
      })
      .eq('id', userId)

    if (!error) {
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, full_name: editForm.full_name, role: editForm.role, phone: editForm.phone } : u
        )
      )
      setEditingUser(null)
    }
    setSaving(false)
  }

  const toggleUserDisabled = async (userId: string, currentlyDisabled: boolean) => {
    if (!isAdmin) return

    const supabase = createClient()
    const updateData = currentlyDisabled
      ? { is_disabled: false, disabled_at: null, disabled_reason: null }
      : { is_disabled: true, disabled_at: new Date().toISOString(), disabled_reason: 'Disabled by admin' }

    const { error } = await supabase.from('profiles').update(updateData).eq('id', userId)

    if (!error) {
      setUsers(
        users.map((u) =>
          u.id === userId
            ? { ...u, is_disabled: !currentlyDisabled, disabled_at: updateData.disabled_at, disabled_reason: updateData.disabled_reason }
            : u
        )
      )
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield size={16} className="text-red-500" />
      case 'law_firm':
        return <Building size={16} className="text-blue-500" />
      case 'attorney':
        return <Briefcase size={16} className="text-purple-500" />
      default:
        return <User size={16} className="text-gray-500" />
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === '' ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  if (!isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500">{users.length} total users</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="law_firm">Law Firms</option>
            <option value="attorney">Attorneys</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Association</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Joined</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-gray-50 ${user.is_disabled ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3">
                      {editingUser === user.id ? (
                        <input
                          type="text"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${user.is_disabled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                              {user.full_name}
                            </p>
                            {user.is_disabled && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">
                                Disabled
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingUser === user.id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="customer">Customer</option>
                          <option value="law_firm">Law Firm</option>
                          <option value="attorney">Attorney</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}
                        >
                          {getRoleIcon(user.role)}
                          {user.role.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.law_firms && user.law_firms.length > 0 && (
                        <span className="text-blue-600">Owns: {user.law_firms[0].name}</span>
                      )}
                      {user.attorneys && user.attorneys.length > 0 && (
                        <span className="text-purple-600">
                          Attorney at: {user.attorneys[0].law_firms?.name || 'Unknown'}
                        </span>
                      )}
                      {(!user.law_firms || user.law_firms.length === 0) &&
                        (!user.attorneys || user.attorneys.length === 0) && (
                          <span className="text-gray-400">-</span>
                        )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {editingUser === user.id ? (
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Phone number"
                        />
                      ) : (
                        user.phone || <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {editingUser === user.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveUser(user.id)}
                            disabled={saving}
                            className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                            title="Save"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            title="Cancel"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/dashboard/users/${user.id}`}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </Link>
                          <button
                            onClick={() => startEdit(user)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit User"
                          >
                            <Edit2 size={18} />
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => toggleUserDisabled(user.id, !!user.is_disabled)}
                              className={`p-1 rounded ${
                                user.is_disabled
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                              title={user.is_disabled ? 'Enable User' : 'Disable User'}
                            >
                              {user.is_disabled ? <CheckCircle size={18} /> : <Ban size={18} />}
                            </button>
                          )}
                        </div>
                      )}
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

'use client'

import { useAuth } from '@/providers/AuthProvider'

export default function CustomerProfilePage() {
  const { profile } = useAuth()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>

      <dl className="space-y-4">
        <div>
          <dt className="text-sm text-gray-600">Name</dt>
          <dd className="font-medium text-gray-900">{profile?.full_name || 'Not set'}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-600">Email</dt>
          <dd className="font-medium text-gray-900">{profile?.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-600">Phone</dt>
          <dd className="font-medium text-gray-900">{profile?.phone || 'Not set'}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-600">Role</dt>
          <dd className="font-medium text-gray-900 capitalize">
            {profile?.customer_type?.replace('_', ' ') || 'Customer'}
          </dd>
        </div>
      </dl>

      <div className="mt-6 pt-6 border-t">
        <p className="text-sm text-gray-500">Profile editing coming soon.</p>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { UserPlus, Mail, Copy, Check, X, Clock, User, Phone } from 'lucide-react'

interface Attorney {
  id: string
  is_active: boolean
  profiles: {
    full_name: string
    email: string
    phone: string | null
  }
}

interface Invitation {
  id: string
  email: string
  status: string
  expires_at: string
  created_at: string
  token: string
}

export default function LawFirmAttorneysPage() {
  const { user } = useAuth()
  const [lawFirmId, setLawFirmId] = useState<string | null>(null)
  const [attorneys, setAttorneys] = useState<Attorney[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const userId = user.id

    async function fetchData() {
      const supabase = createClient()

      // Get law firm ID
      const { data: firmData } = await supabase
        .from('law_firms')
        .select('id')
        .eq('owner_id', userId)
        .single()

      if (!firmData) {
        setLoading(false)
        return
      }

      setLawFirmId(firmData.id)

      // Fetch attorneys
      const { data: attorneyData } = await supabase
        .from('attorneys')
        .select('id, is_active, profiles (full_name, email, phone)')
        .eq('law_firm_id', firmData.id)

      if (attorneyData) {
        setAttorneys(attorneyData as Attorney[])
      }

      // Fetch pending invitations
      const { data: inviteData } = await supabase
        .from('attorney_invitations')
        .select('*')
        .eq('law_firm_id', firmData.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (inviteData) {
        setInvitations(inviteData)
      }

      setLoading(false)
    }

    fetchData()
  }, [user])

  const generateToken = () => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const handleInvite = async () => {
    if (!lawFirmId || !inviteEmail || !user) return
    setInviting(true)

    try {
      const supabase = createClient()
      const token = generateToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

      const { data, error } = await supabase
        .from('attorney_invitations')
        .insert({
          law_firm_id: lawFirmId,
          email: inviteEmail,
          token: token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      setInvitations([data, ...invitations])
      setInviteEmail('')
      setShowInviteModal(false)
    } catch (err) {
      console.error('Invite error:', err)
      alert('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const cancelInvitation = async (inviteId: string) => {
    const supabase = createClient()
    await supabase.from('attorney_invitations').update({ status: 'cancelled' }).eq('id', inviteId)

    setInvitations(invitations.filter((i) => i.id !== inviteId))
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/attorney/${token}`
    navigator.clipboard.writeText(link)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Attorneys</h2>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          <UserPlus size={16} />
          Invite Attorney
        </button>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
            <Clock size={18} />
            Pending Invitations ({invitations.length})
          </h3>
          <div className="space-y-2">
            {invitations.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between bg-white p-3 rounded border"
              >
                <div>
                  <p className="font-medium text-gray-900">{invite.email}</p>
                  <p className="text-xs text-gray-500">
                    Expires {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyInviteLink(invite.token)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Copy invite link"
                  >
                    {copied === invite.token ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => cancelInvitation(invite.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Cancel invitation"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attorneys List */}
      <div className="bg-white rounded-lg shadow">
        {attorneys.length === 0 ? (
          <div className="p-8 text-center">
            <UserPlus className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-600 mb-2">No attorneys yet</p>
            <p className="text-sm text-gray-500">
              Invite attorneys to join your firm and start assigning orders.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {attorneys.map((attorney) => (
                <tr key={attorney.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{attorney.profiles.full_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{attorney.profiles.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {attorney.profiles.phone || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        attorney.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {attorney.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowInviteModal(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Attorney</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the attorney's email address. They'll receive a link to join your firm.
            </p>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="attorney@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail || inviting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {inviting ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

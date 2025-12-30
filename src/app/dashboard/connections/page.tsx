'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import type { Contact, ContactType } from '@/types'
import {
  Mail,
  Phone,
  MessageSquare,
  UserPlus,
  Users,
  Building,
  Briefcase,
  Star,
  StarOff,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Banknote,
  Home,
  FileText,
  Stamp,
} from 'lucide-react'

// Extended Contact with profile data from the query
interface ContactWithProfile extends Omit<Contact, 'contact_profile'> {
  contact_profile?: {
    full_name: string
    email: string
    phone: string | null
  } | null
}

export default function DashboardConnectionsPage() {
  const { user, profile, isLoading: authLoading } = useAuth()
  const [contacts, setContacts] = useState<ContactWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<ContactType | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state for adding new contact
  const [newContact, setNewContact] = useState({
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    company_name: '',
    contact_type: 'other' as ContactType,
    notes: '',
  })

  useEffect(() => {
    if (!user) return
    fetchContacts()
  }, [user])

  async function fetchContacts() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        contact_profile:profiles!contacts_contact_profile_id_fkey (
          full_name,
          email,
          phone
        )
      `)
      .eq('owner_id', user!.id)
      .order('is_favorite', { ascending: false })
      .order('last_interaction_at', { ascending: false, nullsFirst: false })

    if (error) {
      console.error('Error fetching contacts:', error)
    } else {
      setContacts(data as ContactWithProfile[])
    }
    setLoading(false)
  }

  async function toggleFavorite(contactId: string, currentValue: boolean) {
    const supabase = createClient()
    const { error } = await supabase
      .from('contacts')
      .update({ is_favorite: !currentValue })
      .eq('id', contactId)

    if (!error) {
      setContacts(prev => prev.map(c =>
        c.id === contactId ? { ...c, is_favorite: !currentValue } : c
      ))
    }
  }

  async function deleteContact(contactId: string) {
    if (!confirm('Are you sure you want to delete this contact?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)

    if (!error) {
      setContacts(prev => prev.filter(c => c.id !== contactId))
    }
  }

  async function addContact() {
    if (!newContact.contact_name.trim()) {
      alert('Please enter a contact name')
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        owner_id: user!.id,
        contact_name: newContact.contact_name,
        contact_email: newContact.contact_email || null,
        contact_phone: newContact.contact_phone || null,
        company_name: newContact.company_name || null,
        contact_type: newContact.contact_type,
        notes: newContact.notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding contact:', error)
      alert('Failed to add contact')
    } else {
      setContacts(prev => [data as ContactWithProfile, ...prev])
      setShowAddModal(false)
      setNewContact({
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        company_name: '',
        contact_type: 'other',
        notes: '',
      })
    }
  }

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = searchTerm === '' ||
      contact.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || contact.contact_type === filterType

    return matchesSearch && matchesType
  })

  // Split into favorites and others
  const favoriteContacts = filteredContacts.filter(c => c.is_favorite)
  const otherContacts = filteredContacts.filter(c => !c.is_favorite)

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  // Contact type icon and label helpers
  const getContactTypeIcon = (type: ContactType) => {
    switch (type) {
      case 'attorney':
        return <Briefcase size={16} className="text-purple-500" />
      case 'paralegal':
        return <Users size={16} className="text-green-500" />
      case 'lender':
      case 'loan_officer':
        return <Banknote size={16} className="text-amber-500" />
      case 'real_estate_agent':
        return <Home size={16} className="text-blue-500" />
      case 'title_agent':
        return <FileText size={16} className="text-teal-500" />
      case 'notary':
        return <Stamp size={16} className="text-indigo-500" />
      default:
        return <Users size={16} className="text-gray-500" />
    }
  }

  const getContactTypeLabel = (type: ContactType) => {
    switch (type) {
      case 'attorney':
        return 'Attorney'
      case 'paralegal':
        return 'Paralegal'
      case 'lender':
        return 'Lender'
      case 'loan_officer':
        return 'Loan Officer'
      case 'real_estate_agent':
        return 'Real Estate Agent'
      case 'title_agent':
        return 'Title Agent'
      case 'notary':
        return 'Notary'
      default:
        return 'Other'
    }
  }

  const contactTypes: ContactType[] = [
    'attorney', 'paralegal', 'lender', 'loan_officer',
    'real_estate_agent', 'title_agent', 'notary', 'other'
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Connections</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <UserPlus size={18} />
          Add Connection
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ContactType | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            {contactTypes.map(type => (
              <option key={type} value={type}>{getContactTypeLabel(type)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Favorites Section */}
      {favoriteContacts.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b flex items-center gap-2">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <h2 className="font-semibold text-gray-900">Favorites</h2>
            <span className="text-sm text-gray-500">({favoriteContacts.length})</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-10 px-4 py-3"></th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {favoriteContacts.map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    onToggleFavorite={toggleFavorite}
                    onDelete={deleteContact}
                    getTypeIcon={getContactTypeIcon}
                    getTypeLabel={getContactTypeLabel}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Contacts Section */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">
            {favoriteContacts.length > 0 ? 'Other Contacts' : 'All Contacts'}
          </h2>
          <span className="text-sm text-gray-500">({otherContacts.length} contacts)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {otherContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {contacts.length === 0
                      ? 'No contacts yet. Add your first connection!'
                      : 'No contacts match your search'}
                  </td>
                </tr>
              ) : (
                otherContacts.map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    onToggleFavorite={toggleFavorite}
                    onDelete={deleteContact}
                    getTypeIcon={getContactTypeIcon}
                    getTypeLabel={getContactTypeLabel}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Add New Contact</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newContact.contact_name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, contact_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newContact.contact_type}
                  onChange={(e) => setNewContact(prev => ({ ...prev, contact_type: e.target.value as ContactType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {contactTypes.map(type => (
                    <option key={type} value={type}>{getContactTypeLabel(type)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={newContact.company_name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, company_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ABC Law Firm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newContact.contact_email}
                  onChange={(e) => setNewContact(prev => ({ ...prev, contact_email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newContact.contact_phone}
                  onChange={(e) => setNewContact(prev => ({ ...prev, contact_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newContact.notes}
                  onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional notes about this contact..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={addContact}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Add Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Contact Row Component
function ContactRow({
  contact,
  onToggleFavorite,
  onDelete,
  getTypeIcon,
  getTypeLabel,
}: {
  contact: ContactWithProfile
  onToggleFavorite: (id: string, current: boolean) => void
  onDelete: (id: string) => void
  getTypeIcon: (type: ContactType) => React.ReactNode
  getTypeLabel: (type: ContactType) => string
}) {
  const [showMenu, setShowMenu] = useState(false)

  // Use profile data if linked, otherwise use contact data
  const displayName = contact.contact_profile?.full_name || contact.contact_name
  const displayEmail = contact.contact_profile?.email || contact.contact_email
  const displayPhone = contact.contact_profile?.phone || contact.contact_phone

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <button
          onClick={() => onToggleFavorite(contact.id, contact.is_favorite)}
          className="p-1 text-gray-400 hover:text-yellow-500"
        >
          {contact.is_favorite ? (
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
          ) : (
            <StarOff size={16} />
          )}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {getTypeIcon(contact.contact_type)}
          <span className="text-sm text-gray-600">{getTypeLabel(contact.contact_type)}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-gray-900">{displayName}</span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {contact.company_name || '-'}
      </td>
      <td className="px-4 py-3">
        {displayEmail ? (
          <a href={`mailto:${displayEmail}`} className="text-sm text-blue-600 hover:underline">
            {displayEmail}
          </a>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-3">
        {displayPhone ? (
          <a href={`tel:${displayPhone}`} className="text-sm text-blue-600 hover:underline">
            {displayPhone}
          </a>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {displayEmail && (
            <a
              href={`mailto:${displayEmail}`}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Send Email"
            >
              <Mail size={16} />
            </a>
          )}
          {displayPhone && (
            <a
              href={`tel:${displayPhone}`}
              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
              title="Call"
            >
              <Phone size={16} />
            </a>
          )}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              <MoreVertical size={16} />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border z-20">
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      // Edit functionality could be added here
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      onDelete(contact.id)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

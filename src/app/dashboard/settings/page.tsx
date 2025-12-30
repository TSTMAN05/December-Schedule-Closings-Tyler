'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui'
import { SERVICE_PROVIDER_TYPES } from '@/components/dashboard/views'
import {
  Save,
  Bell,
  Lock,
  User,
  Mail,
  Phone,
  Building,
  FileText,
  HelpCircle,
  DollarSign,
  Info,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'

type SettingsTab = 'general' | 'firm_controls' | 'account_security' | 'notifications'
type GeneralSection = 'admin_account' | 'firm_account' | 'company_forms' | 'faqs' | 'fees'

export default function DashboardSettingsPage() {
  const { user, profile, isLoading } = useAuth()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [activeSection, setActiveSection] = useState<GeneralSection>('admin_account')
  const [lawFirmId, setLawFirmId] = useState<string | null>(null)

  const roleName = profile?.profile_type || profile?.role || 'customer'
  const isServiceProvider = SERVICE_PROVIDER_TYPES.includes(roleName as typeof SERVICE_PROVIDER_TYPES[number])

  const [form, setForm] = useState({
    first_name: profile?.full_name?.split(' ')[0] || '',
    last_name: profile?.full_name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    mobile_number: profile?.phone || '',
    company_name: '',
    show_office_number: false,
    use_mobile_number: true,
  })

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    orderStatus: true,
    closingReminders: true,
    marketing: false,
  })

  useEffect(() => {
    if (user && isServiceProvider) {
      fetchLawFirmData()
    }
  }, [user, isServiceProvider])

  async function fetchLawFirmData() {
    const supabase = createClient()
    const { data } = await supabase
      .from('law_firms')
      .select('id, name')
      .eq('owner_id', user!.id)
      .single()

    if (data) {
      setLawFirmId(data.id)
      setForm(prev => ({ ...prev, company_name: data.name }))
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: `${form.first_name} ${form.last_name}`.trim(),
        phone: form.phone,
      })
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully' })
    }
    setSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  // Customer view - simple settings
  if (!isServiceProvider) {
    return (
      <div className="space-y-6 max-w-4xl">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>

        {/* Profile Settings */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b flex items-center gap-2">
            <User size={20} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Profile Information</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b flex items-center gap-2">
            <Bell size={20} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="p-4 space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Order Status Changes</p>
                <p className="text-sm text-gray-500">Get notified when your order status changes</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.orderStatus}
                onChange={(e) => setNotifications({ ...notifications, orderStatus: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Closing Reminders</p>
                <p className="text-sm text-gray-500">Receive reminders before your closing date</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.closingReminders}
                onChange={(e) => setNotifications({ ...notifications, closingReminders: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>
      </div>
    )
  }

  // Service Provider (Law Firm) view - tabbed settings
  const tabs = [
    { id: 'general' as SettingsTab, label: 'General' },
    { id: 'firm_controls' as SettingsTab, label: 'Firm Controls' },
    { id: 'account_security' as SettingsTab, label: 'Account Security' },
    { id: 'notifications' as SettingsTab, label: 'Notifications' },
  ]

  const generalSections = [
    { id: 'admin_account' as GeneralSection, label: 'Admin Account', icon: User },
    { id: 'firm_account' as GeneralSection, label: 'Firm Account', icon: Building },
    { id: 'company_forms' as GeneralSection, label: 'Company Forms', icon: FileText },
    { id: 'faqs' as GeneralSection, label: 'FAQs', icon: HelpCircle },
    { id: 'fees' as GeneralSection, label: 'Fees', icon: DollarSign },
  ]

  const legalDocuments = [
    { label: 'Schedule Closings - Privacy Policy', href: '#' },
    { label: 'Schedule Closings Title - Privacy Policy', href: '#' },
    { label: 'Schedule Closings Title - Terms of Service', href: '#' },
    { label: 'ABA Disclosure', href: '#' },
    { label: 'TCPA Consent', href: '#' },
  ]

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b bg-white -mx-6 px-6 -mt-6 pt-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Left Sidebar - Section Navigation (only for General tab) */}
        {activeTab === 'general' && (
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {generalSections.map(section => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} />
                    {section.label}
                  </button>
                )
              })}
            </nav>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {/* General Tab - Admin Account Section */}
          {activeTab === 'general' && activeSection === 'admin_account' && (
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Admin Details</h2>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
              <div className="p-4 space-y-6">
                <div className="text-sm text-gray-500">
                  Unique ID: {user?.id?.slice(0, 8)}-{user?.id?.slice(8, 12)}-{user?.id?.slice(12, 14)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Email <span className="text-red-500">*</span>
                      <Info size={14} className="inline ml-1 text-gray-400" />
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Mobile Number <span className="text-red-500">*</span>
                      <Info size={14} className="inline ml-1 text-gray-400" />
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(123) 456-7890"
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Additional Information</h3>
                    <button className="text-sm text-blue-600 hover:underline">Save Changes</button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      If Office Number is selected, we will show your Office Number to users where applicable.
                      If Mobile Number is selected, we will show your Mobile Number to users where applicable.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={form.show_office_number}
                        onChange={(e) => setForm({ ...form, show_office_number: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Show Office Number</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={form.use_mobile_number}
                        onChange={(e) => setForm({ ...form, use_mobile_number: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Use Primary Mobile Number <span className="text-gray-400">(123) 456-7890</span>
                      </span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        value={form.mobile_number}
                        onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
                        className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="(123) 456-7890"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={form.company_name}
                        onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                        className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter company name"
                      />
                    </div>
                  </div>
                </div>

                {/* Legal Documents */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-3">Legal Documents I&apos;ve Agreed To</h3>
                  <div className="space-y-2">
                    {legalDocuments.map((doc, index) => (
                      <a
                        key={index}
                        href={doc.href}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <FileText size={14} />
                        {doc.label}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t flex justify-end gap-3">
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium">
                    Discard All Changes
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {saving ? 'Saving...' : 'Save All Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* General Tab - Firm Account Section */}
          {activeTab === 'general' && activeSection === 'firm_account' && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Firm Account</h2>
              <p className="text-gray-500">Firm account settings coming soon...</p>
            </div>
          )}

          {/* General Tab - Company Forms Section */}
          {activeTab === 'general' && activeSection === 'company_forms' && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Company Forms</h2>
              <p className="text-gray-500">Upload and manage company forms here...</p>
            </div>
          )}

          {/* General Tab - FAQs Section */}
          {activeTab === 'general' && activeSection === 'faqs' && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-500">FAQ content coming soon...</p>
            </div>
          )}

          {/* General Tab - Fees Section */}
          {activeTab === 'general' && activeSection === 'fees' && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Fee Schedule</h2>
              <p className="text-gray-500">Manage your fee schedule here...</p>
            </div>
          )}

          {/* Firm Controls Tab */}
          {activeTab === 'firm_controls' && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Firm Controls</h2>
              <p className="text-gray-500">Firm control settings coming soon...</p>
            </div>
          )}

          {/* Account Security Tab */}
          {activeTab === 'account_security' && (
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b flex items-center gap-2">
                <Lock size={20} className="text-gray-500" />
                <h2 className="font-semibold text-gray-900">Account Security</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">Change Password</p>
                    <p className="text-sm text-gray-500">Update your password regularly for security</p>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Change Password
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Enable 2FA
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">Active Sessions</p>
                    <p className="text-sm text-gray-500">Manage devices where you&apos;re logged in</p>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    View Sessions
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg border">
              <div className="p-4 border-b flex items-center gap-2">
                <Bell size={20} className="text-gray-500" />
                <h2 className="font-semibold text-gray-900">Notification Preferences</h2>
              </div>
              <div className="p-4 space-y-4">
                <label className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">Email Updates</p>
                    <p className="text-sm text-gray-500">Receive updates about your account</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.emailUpdates}
                    onChange={(e) => setNotifications({ ...notifications, emailUpdates: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">Order Status Changes</p>
                    <p className="text-sm text-gray-500">Get notified when order status changes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.orderStatus}
                    onChange={(e) => setNotifications({ ...notifications, orderStatus: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">Closing Reminders</p>
                    <p className="text-sm text-gray-500">Receive reminders before closing dates</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.closingReminders}
                    onChange={(e) => setNotifications({ ...notifications, closingReminders: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">Marketing Communications</p>
                    <p className="text-sm text-gray-500">Receive promotional emails and offers</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.marketing}
                    onChange={(e) => setNotifications({ ...notifications, marketing: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

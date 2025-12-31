'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Info, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
]

const SERVICE_PROVIDER_TYPES = [
  'law_firm',
  'title_company',
  'title_search',
  'title_insurance',
  'notary',
]

function SetupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const profileType = searchParams.get('type')
  const { user, isLoading: authLoading } = useAuth()

  const [formData, setFormData] = useState({
    companyName: '',
    licensedStates: [] as string[],
    email: '',
    phone: '',
    useAccountEmail: false,
    useAccountPhone: false,
    // Individual fields
    licenseNumber: '',
    brokerageName: '',
    nmlsNumber: '',
  })
  const [loading, setLoading] = useState(false)
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [demoScheduled, setDemoScheduled] = useState<string | null>(null)
  const [showStatesDropdown, setShowStatesDropdown] = useState(false)

  const isServiceProvider = SERVICE_PROVIDER_TYPES.includes(profileType || '')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }

    // Check if admin - admins don't need onboarding
    const checkAdminStatus = async () => {
      if (!user) return
      const supabase = createClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_type')
        .eq('id', user.id)
        .single()

      if (profile?.profile_type === 'admin') {
        router.push('/dashboard')
      }
    }

    if (user) {
      checkAdminStatus()
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || '',
      }))
    }
  }, [user])

  const handleStateToggle = (stateValue: string) => {
    setFormData((prev) => ({
      ...prev,
      licensedStates: prev.licensedStates.includes(stateValue)
        ? prev.licensedStates.filter((s) => s !== stateValue)
        : [...prev.licensedStates, stateValue],
    }))
  }

  const handleBack = () => {
    router.push('/onboarding')
  }

  const generateSlug = (name: string) => {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 6)
    return `${baseSlug}-${randomSuffix}`
  }

  const handleContinue = async () => {
    if (!user || !profileType) return
    setLoading(true)

    const supabase = createClient()

    try {
      // Create the appropriate profile based on type
      if (profileType === 'law_firm') {
        const slug = generateSlug(formData.companyName)
        console.log('Creating law firm with data:', {
          owner_id: user.id,
          name: formData.companyName,
          slug: slug,
          email: formData.useAccountEmail ? user.email : formData.email,
          phone: formData.phone,
          status: 'active',
        })

        const { data: lawFirmData, error: lawFirmError } = await supabase.from('law_firms').insert({
          owner_id: user.id,
          name: formData.companyName,
          slug: slug,
          email: formData.useAccountEmail ? user.email : formData.email,
          phone: formData.phone,
          status: 'active',
        }).select()

        if (lawFirmError) {
          console.error('Error creating law firm:', {
            message: lawFirmError.message,
            code: lawFirmError.code,
            details: lawFirmError.details,
            hint: lawFirmError.hint,
          })
          throw new Error(`Failed to create law firm: ${lawFirmError.message || 'Unknown error'}`)
        }
        console.log('Law firm created successfully:', lawFirmData)
      }

      // Determine the appropriate role based on profile type
      // Service providers get 'law_firm' role, individuals get 'customer' role
      const serviceProviderTypes = ['law_firm', 'title_company', 'title_search', 'title_insurance', 'notary']
      const role = serviceProviderTypes.includes(profileType || '') ? 'law_firm' : 'customer'

      // Update profile with onboarding progress AND ensure profile_type is saved
      console.log('Updating profile with:', {
        profile_type: profileType,
        profile_category: isServiceProvider ? 'service_provider' : 'individual',
        onboarding_step: 3,
        role: role,
      })

      const { data: profileData, error: updateError } = await supabase
        .from('profiles')
        .update({
          profile_type: profileType,
          profile_category: isServiceProvider ? 'service_provider' : 'individual',
          onboarding_step: 3,
          role: role,
        })
        .eq('id', user.id)
        .select()

      if (updateError) {
        console.error('Error updating profile:', {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
        })
        throw new Error(`Failed to update profile: ${updateError.message || 'Unknown error'}`)
      }
      console.log('Profile updated successfully:', profileData)

      router.push('/onboarding/complete')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error saving profile:', errorMessage, error)
      alert(`Failed to save profile: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const getFormTitle = () => {
    switch (profileType) {
      case 'law_firm':
        return 'Law Firm Company Profile'
      case 'title_company':
        return 'Title Company Profile'
      case 'title_search':
        return 'Title Search Company Profile'
      case 'title_insurance':
        return 'Title Insurance Agency Profile'
      case 'notary':
        return 'Notary Profile'
      case 'real_estate_agent':
        return 'Real Estate Agent Profile'
      case 'closing_coordinator':
        return 'Closing Coordinator Profile'
      case 'lender':
        return 'Lender / Loan Officer Profile'
      case 'loan_processor':
        return 'Loan Processor Profile'
      case 'customer':
        return 'Customer Profile'
      default:
        return 'Setup Profile'
    }
  }

  const isFormValid = () => {
    if (profileType === 'customer') return true
    if (!formData.companyName) return false
    if (!formData.email && !formData.useAccountEmail) return false
    if (!formData.phone) return false
    if (isServiceProvider && formData.licensedStates.length === 0) return false
    return true
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-900 rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">SC</span>
          </div>
          <span className="font-semibold text-blue-900">Schedule Closings</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Schedule Closings!</h1>
          <p className="text-gray-600 mt-2">
            Don&apos;t worry, we&apos;ll guide you through setting up your account in no time.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Setup Profile</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
              STEP 2/3
            </span>
          </div>

          {/* Info Banner for Service Providers */}
          {isServiceProvider && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p>
                  {profileType === 'law_firm' ? 'Law Firm' : 'Service Provider'} profile accounts
                  must be approved by Schedule Closings for full site use and public visibility.
                </p>
                <p className="mt-2">
                  You can also schedule a conversation with our team to discuss functionality and
                  how the whole system works.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{getFormTitle()}</h3>
            <p className="text-sm text-gray-500 mb-6">
              {isServiceProvider
                ? 'Process real estate closing transactions'
                : 'Manage your closing appointments'}
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Company/Business Name */}
              {profileType !== 'customer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isServiceProvider ? 'Company Name' : 'Business/Company Name'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                    }
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter company name"
                  />
                </div>
              )}

              {/* Licensed States */}
              {(isServiceProvider ||
                profileType === 'real_estate_agent' ||
                profileType === 'lender') && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Licensed States <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowStatesDropdown(!showStatesDropdown)}
                    className="w-full border rounded-lg px-4 py-2.5 text-left flex items-center justify-between bg-white"
                  >
                    <span className={formData.licensedStates.length === 0 ? 'text-gray-400' : ''}>
                      {formData.licensedStates.length === 0
                        ? 'Select states'
                        : formData.licensedStates.join(', ')}
                    </span>
                    <ChevronRight
                      size={16}
                      className={`transition-transform ${showStatesDropdown ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {showStatesDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {US_STATES.map((state) => (
                        <label
                          key={state.value}
                          className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.licensedStates.includes(state.value)}
                            onChange={() => handleStateToggle(state.value)}
                            className="rounded text-blue-600 mr-3"
                          />
                          <span className="text-sm">
                            {state.label} ({state.value})
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isServiceProvider ? 'Company Main Email Address' : 'Email Address'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.useAccountEmail ? user?.email || '' : formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  disabled={formData.useAccountEmail}
                  className="w-full border rounded-lg px-4 py-2.5 disabled:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
                <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.useAccountEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, useAccountEmail: e.target.checked }))
                    }
                    className="rounded text-blue-600"
                  />
                  Use Account Email ({user?.email})
                </label>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isServiceProvider ? 'Company Main Contact Number' : 'Phone Number'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter contact number"
                />
                <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.useAccountPhone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, useAccountPhone: e.target.checked }))
                    }
                    className="rounded text-blue-600"
                  />
                  Use Account Mobile Number
                </label>
              </div>

              {/* Type-specific fields */}
              {profileType === 'real_estate_agent' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, licenseNumber: e.target.value }))
                      }
                      className="w-full border rounded-lg px-4 py-2.5"
                      placeholder="Enter license number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brokerage Name
                    </label>
                    <input
                      type="text"
                      value={formData.brokerageName}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, brokerageName: e.target.value }))
                      }
                      className="w-full border rounded-lg px-4 py-2.5"
                      placeholder="Enter brokerage name"
                    />
                  </div>
                </>
              )}

              {profileType === 'lender' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NMLS Number</label>
                  <input
                    type="text"
                    value={formData.nmlsNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nmlsNumber: e.target.value }))
                    }
                    className="w-full border rounded-lg px-4 py-2.5"
                    placeholder="Enter NMLS number"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Demo Scheduled Badge */}
          {demoScheduled && (
            <div className="mt-6 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg text-sm">
              <Calendar size={16} />
              Demo Scheduled {demoScheduled}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            {isServiceProvider ? (
              <button
                onClick={() => setShowDemoModal(true)}
                className="flex items-center gap-2 px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Calendar size={18} />
                Schedule a Demo
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="px-6 py-2.5 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                disabled={loading || !isFormValid()}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Continue to Checklist to Go Live'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Demo Modal */}
      {showDemoModal && (
        <DemoModal
          onClose={() => setShowDemoModal(false)}
          onScheduled={(date) => {
            setDemoScheduled(date)
            setShowDemoModal(false)
          }}
        />
      )}
    </div>
  )
}

function DemoModal({
  onClose,
  onScheduled,
}: {
  onClose: () => void
  onScheduled: (date: string) => void
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (number | null)[] = []
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const isDateAvailable = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayOfWeek = date.getDay()
    return date >= today && dayOfWeek !== 0 && dayOfWeek !== 6
  }

  const handleDateClick = (day: number) => {
    if (isDateAvailable(day)) {
      setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))
    }
  }

  const handleSchedule = () => {
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
      onScheduled(`${formattedDate} - 1:00PM`)
    }
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Schedule a Demo</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left side - Info */}
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="text-white" size={24} />
              </div>
              <p className="text-sm text-gray-500 mb-2">Schedule Closings Sales Team</p>
              <h4 className="text-xl font-bold text-gray-900 mb-4">Schedule Closings Discussion</h4>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <span className="text-sm">30 min</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Web conferencing details provided upon confirmation.
              </p>
              <p className="text-sm text-gray-700">
                Find some time on my calendar to find out what Schedule Closings can do for you and
                your team.
              </p>
            </div>

            {/* Right side - Calendar */}
            <div>
              <h4 className="font-semibold mb-4">Select a Date & Time</h4>

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                    )
                  }
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="font-medium">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                    )
                  }
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                  <div key={day} className="text-gray-500 text-xs py-2">
                    {day}
                  </div>
                ))}
                {getDaysInMonth(currentMonth).map((day, index) => (
                  <div key={index}>
                    {day && (
                      <button
                        onClick={() => handleDateClick(day)}
                        disabled={!isDateAvailable(day)}
                        className={`w-8 h-8 rounded-full text-sm transition-colors ${
                          selectedDate?.getDate() === day &&
                          selectedDate?.getMonth() === currentMonth.getMonth()
                            ? 'bg-blue-600 text-white'
                            : isDateAvailable(day)
                              ? 'hover:bg-blue-100 text-blue-600 font-medium'
                              : 'text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {day}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Time zone: Eastern Time - US & Canada (7:44am)
              </p>

              <button
                onClick={handleSchedule}
                disabled={!selectedDate}
                className="w-full mt-4 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <SetupPageContent />
    </Suspense>
  )
}

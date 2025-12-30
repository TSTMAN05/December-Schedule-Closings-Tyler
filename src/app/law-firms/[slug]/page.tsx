'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { AuthModal } from '@/components/auth'
import {
  MapPin,
  Phone,
  Globe,
  Mail,
  Star,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Award,
  DollarSign,
  HelpCircle,
  Users,
  Building,
  CheckCircle,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react'

// Social media icons
const FacebookIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const InstagramIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)

const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const TwitterIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

interface LawFirm {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  website: string | null
  description: string | null
  cover_image_url: string | null
  logo_url: string | null
  status: string
}

interface Office {
  id: string
  name: string
  street_address: string
  city: string
  state: string
  zip_code: string
  phone: string | null
  is_primary: boolean
  latitude: number | null
  longitude: number | null
}

interface StaffMember {
  id: string
  title: string | null
  is_active: boolean
  profiles: {
    full_name: string
    email: string
    avatar_url: string | null
  } | null
}

export default function PublicLawFirmProfilePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { user } = useAuth()

  const [lawFirm, setLawFirm] = useState<LawFirm | null>(null)
  const [offices, setOffices] = useState<Office[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('about')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Placeholder data for features not yet in DB
  const services = ['Closings', 'Title Insurance', 'Real Estate Transactions']
  const socialLinks: Record<string, string> = {}

  useEffect(() => {
    fetchLawFirmData()
  }, [slug])

  const fetchLawFirmData = async () => {
    const supabase = createClient()

    // Fetch law firm by slug
    const { data: firmData, error } = await supabase
      .from('law_firms')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single()

    if (error || !firmData) {
      setLoading(false)
      return
    }

    setLawFirm(firmData)

    // Fetch office locations
    const { data: officesData } = await supabase
      .from('office_locations')
      .select('*')
      .eq('law_firm_id', firmData.id)
      .order('is_primary', { ascending: false })

    if (officesData) setOffices(officesData)

    // Fetch attorneys/staff
    const { data: staffData } = await supabase
      .from('attorneys')
      .select('*, profiles(full_name, email, avatar_url)')
      .eq('law_firm_id', firmData.id)
      .eq('is_active', true)

    if (staffData) setStaff(staffData)

    setLoading(false)
  }

  const mainOffice = offices.find((o) => o.is_primary) || offices[0]

  const handleScheduleClick = () => {
    if (user) {
      router.push(`/order/new?firm=${lawFirm?.id}`)
    } else {
      setShowAuthModal(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!lawFirm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Building className="mx-auto text-gray-400 mb-4" size={64} />
          <h1 className="text-2xl font-bold text-gray-900">Law Firm Not Found</h1>
          <p className="text-gray-600 mt-2">
            This law firm doesn&apos;t exist or is not available.
          </p>
          <Link
            href="/search"
            className="text-blue-600 hover:underline mt-4 inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Search
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image */}
      <div className="relative h-64 bg-gradient-to-r from-blue-600 to-blue-800">
        {lawFirm.cover_image_url && (
          <Image
            src={lawFirm.cover_image_url}
            alt="Cover"
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />

        {/* Back Button */}
        <Link
          href="/search"
          className="absolute top-4 left-4 bg-white/90 hover:bg-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Search
        </Link>
      </div>

      {/* Profile Header */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative -mt-20 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-gray-100 rounded-xl overflow-hidden border-4 border-white shadow-md">
                  {lawFirm.logo_url ? (
                    <Image
                      src={lawFirm.logo_url}
                      alt={lawFirm.name}
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Building size={48} />
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{lawFirm.name}</h1>

                    {/* Contact Info */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                      {lawFirm.email && (
                        <a
                          href={`mailto:${lawFirm.email}`}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          <Mail size={16} />
                          {lawFirm.email}
                        </a>
                      )}
                      {lawFirm.phone && (
                        <a
                          href={`tel:${lawFirm.phone}`}
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          <Phone size={16} />
                          {lawFirm.phone}
                        </a>
                      )}
                      {lawFirm.website && (
                        <a
                          href={
                            lawFirm.website.startsWith('http')
                              ? lawFirm.website
                              : `https://${lawFirm.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-blue-600"
                        >
                          <Globe size={16} />
                          Website
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    {/* Main Office */}
                    {mainOffice && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                        <MapPin size={16} />
                        {mainOffice.street_address}, {mainOffice.city}, {mainOffice.state}{' '}
                        {mainOffice.zip_code}
                      </div>
                    )}
                  </div>

                  {/* Schedule Button */}
                  <button
                    onClick={handleScheduleClick}
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Schedule Closing
                  </button>
                </div>

                {/* Social Links */}
                {Object.keys(socialLinks).length > 0 && (
                  <div className="flex items-center gap-3 mt-4">
                    {socialLinks.facebook && (
                      <a
                        href={socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <FacebookIcon />
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a
                        href={socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-pink-600"
                      >
                        <InstagramIcon />
                      </a>
                    )}
                    {socialLinks.linkedin && (
                      <a
                        href={socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-700"
                      >
                        <LinkedInIcon />
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a
                        href={socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-400"
                      >
                        <TwitterIcon />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex gap-1 px-4 overflow-x-auto border-b">
            {[
              { id: 'about', label: 'About' },
              { id: 'locations', label: 'Locations', count: offices.length },
              { id: 'services', label: 'Services' },
              ...(staff.length > 0
                ? [{ id: 'staff', label: 'Staff', count: staff.length }]
                : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {'count' in tab && tab.count !== undefined && (
                  <span className="ml-1 text-xs text-gray-400">({tab.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* About Tab */}
            {activeTab === 'about' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">About {lawFirm.name}</h2>
                {lawFirm.description ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{lawFirm.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description provided.</p>
                )}
              </div>
            )}

            {/* Locations Tab */}
            {activeTab === 'locations' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Office Locations</h2>
                {offices.length === 0 ? (
                  <p className="text-gray-500 italic">No office locations listed.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {offices.map((office) => (
                      <div key={office.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium flex items-center gap-2">
                              {office.name || office.city}
                              {office.is_primary && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  Main Office
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {office.street_address}
                            </p>
                            <p className="text-sm text-gray-600">
                              {office.city}, {office.state} {office.zip_code}
                            </p>
                            {office.phone && (
                              <p className="text-sm text-gray-600 mt-2">
                                <Phone size={14} className="inline mr-1" />
                                {office.phone}
                              </p>
                            )}
                          </div>
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(
                              `${office.street_address}, ${office.city}, ${office.state} ${office.zip_code}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Get Directions
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Services Offered</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {services.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                    >
                      <CheckCircle size={18} className="text-green-500" />
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Staff Tab */}
            {activeTab === 'staff' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Our Team</h2>
                {staff.length === 0 ? (
                  <p className="text-gray-500 italic">No team members listed.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {staff.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <div className="w-14 h-14 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
                          {member.profiles?.avatar_url ? (
                            <Image
                              src={member.profiles.avatar_url}
                              alt={member.profiles?.full_name || 'Staff'}
                              width={56}
                              height={56}
                              className="object-cover"
                            />
                          ) : (
                            <Users size={24} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {member.profiles?.full_name || 'Unknown'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {member.title || 'Attorney'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView="sign_up"
        redirectTo={`/order/new?firm=${lawFirm?.id}`}
      />
    </div>
  )
}

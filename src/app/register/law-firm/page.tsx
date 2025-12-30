'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { AuthModal } from '@/components/auth'
import { Spinner } from '@/components/ui'
import {
  StreetAddressAutocomplete,
  type StreetAddressResult,
} from '@/components/search/StreetAddressAutocomplete'
import { CheckCircle } from 'lucide-react'

interface LawFirmFormData {
  firm_name: string
  firm_email: string
  firm_phone: string
  website: string
  description: string
  // Primary office
  office_name: string
  street_address: string
  city: string
  state: string
  zip_code: string
}

export default function RegisterLawFirmPage() {
  const router = useRouter()
  const { user, profile, isLoading } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [addressSelected, setAddressSelected] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LawFirmFormData>({
    defaultValues: {
      state: 'NC',
      office_name: 'Main Office',
    },
  })

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  // Show auth modal if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Register Your Law Firm</h1>
          <p className="text-gray-600 mb-6">
            Create an account or sign in to register your law firm on Schedule Closings.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Sign In / Create Account
          </button>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            redirectTo="/register/law-firm"
          />
        </div>
      </div>
    )
  }

  // Check if user already has a law firm
  if (profile?.role === 'law_firm') {
    router.push('/dashboard')
    return null
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleAddressSelect = (result: StreetAddressResult) => {
    setValue('street_address', result.streetAddress)
    setValue('city', result.city)
    setValue('state', result.state)
    setValue('zip_code', result.zipCode)
    setCoordinates({ lat: result.latitude, lng: result.longitude })
    setAddressSelected(true)
  }

  const onSubmit = async (data: LawFirmFormData) => {
    if (!user) return
    setSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const slug = generateSlug(data.firm_name)

      // Check if slug already exists
      const { data: existingFirm } = await supabase
        .from('law_firms')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existingFirm) {
        setError('A law firm with a similar name already exists. Please choose a different name.')
        setSubmitting(false)
        return
      }

      // Create the law firm
      const { data: newFirm, error: firmError } = await supabase
        .from('law_firms')
        .insert({
          owner_id: user.id,
          name: data.firm_name,
          slug: slug,
          email: data.firm_email,
          phone: data.firm_phone,
          website: data.website || null,
          description: data.description || null,
          status: 'pending', // Requires admin approval
        })
        .select()
        .single()

      if (firmError) throw firmError

      // Create the primary office location with coordinates
      const { error: officeError } = await supabase.from('office_locations').insert({
        law_firm_id: newFirm.id,
        name: data.office_name,
        street_address: data.street_address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        latitude: coordinates?.lat || null,
        longitude: coordinates?.lng || null,
        is_primary: true,
      })

      if (officeError) throw officeError

      // Update user's role to law_firm
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'law_firm' })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Redirect to success page or dashboard
      router.push('/register/law-firm/success')
    } catch (err) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'Failed to register law firm')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Register Your Law Firm</h1>
          <p className="text-gray-600 mt-2">
            Join Schedule Closings to receive closing orders from customers in your area.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Firm Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Firm Information</h2>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Law Firm Name *</label>
                <input
                  {...register('firm_name', { required: 'Firm name is required' })}
                  className={inputClass}
                  placeholder="Smith & Associates, PLLC"
                />
                {errors.firm_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.firm_name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Firm Email *</label>
                  <input
                    {...register('firm_email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                    })}
                    type="email"
                    className={inputClass}
                    placeholder="closings@smithlaw.com"
                  />
                  {errors.firm_email && (
                    <p className="text-red-500 text-sm mt-1">{errors.firm_email.message}</p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Firm Phone *</label>
                  <input
                    {...register('firm_phone', { required: 'Phone is required' })}
                    type="tel"
                    className={inputClass}
                    placeholder="(704) 555-1234"
                  />
                  {errors.firm_phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.firm_phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClass}>Website</label>
                <input
                  {...register('website')}
                  type="url"
                  className={inputClass}
                  placeholder="https://smithlaw.com"
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className={inputClass}
                  placeholder="Tell us about your firm and the services you offer..."
                />
              </div>
            </div>
          </div>

          {/* Primary Office Location */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Primary Office Location</h2>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Office Name</label>
                <input
                  {...register('office_name')}
                  className={inputClass}
                  placeholder="Main Office"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Street Address *
                  {addressSelected && (
                    <span className="ml-2 inline-flex items-center text-green-600 text-xs font-normal">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Address verified
                    </span>
                  )}
                </label>
                <StreetAddressAutocomplete
                  onSelect={handleAddressSelect}
                  placeholder="Start typing your office address..."
                />
                <input type="hidden" {...register('street_address', { required: 'Street address is required' })} />
                {errors.street_address && !addressSelected && (
                  <p className="text-red-500 text-sm mt-1">Please select an address from the suggestions</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className={labelClass}>City *</label>
                  <input
                    {...register('city', { required: 'City is required' })}
                    className={`${inputClass} bg-gray-50`}
                    placeholder="Charlotte"
                    readOnly
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>State *</label>
                  <input
                    {...register('state', { required: 'State is required' })}
                    className={`${inputClass} bg-gray-50`}
                    placeholder="NC"
                    readOnly
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                  )}
                </div>

                <div>
                  <label className={labelClass}>ZIP *</label>
                  <input
                    {...register('zip_code', { required: 'ZIP is required' })}
                    className={`${inputClass} bg-gray-50`}
                    placeholder="28202"
                    readOnly
                  />
                  {errors.zip_code && (
                    <p className="text-red-500 text-sm mt-1">{errors.zip_code.message}</p>
                  )}
                </div>
              </div>

              {!addressSelected && (
                <p className="text-sm text-gray-500">
                  Start typing your address above and select from the suggestions to auto-fill the location fields.
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !addressSelected}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Registering...' : 'Register Law Firm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Button, Input, Select } from '@/components/ui'
import { LawFirm, OfficeLocation, CustomerType, PropertyType, ClosingType } from '@/types'
import { ArrowLeft, Building2, MapPin } from 'lucide-react'
import Link from 'next/link'

interface OrderFormData {
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_role: CustomerType
  property_street: string
  property_city: string
  property_state: string
  property_zip: string
  property_type: PropertyType
  closing_type: ClosingType
  estimated_closing_date: string
  sale_amount: string
  office_location_id: string
  notes: string
}

interface OrderFormProps {
  lawFirm: LawFirm
}

const customerRoleOptions = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'real_estate_agent', label: 'Real Estate Agent' },
  { value: 'lender', label: 'Lender' },
  { value: 'other', label: 'Other' },
]

const propertyTypeOptions = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
]

const closingTypeOptions = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'refinance', label: 'Refinance' },
  { value: 'heloc', label: 'HELOC' },
  { value: 'other', label: 'Other' },
]

const stateOptions = [
  { value: 'NC', label: 'North Carolina' },
  { value: 'SC', label: 'South Carolina' },
]

export function OrderForm({ lawFirm }: OrderFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { user, profile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormData>({
    defaultValues: {
      customer_name: profile?.full_name || '',
      customer_email: profile?.email || user?.email || '',
      customer_phone: profile?.phone || '',
      customer_role: profile?.customer_type || 'buyer',
      property_street: '',
      property_city: '',
      property_state: 'NC',
      property_zip: '',
      property_type: 'residential',
      closing_type: 'purchase',
      estimated_closing_date: '',
      sale_amount: '',
      office_location_id: lawFirm.office_locations?.find((loc) => loc.is_primary)?.id || lawFirm.office_locations?.[0]?.id || '',
      notes: '',
    },
  })

  const onSubmit = async (data: OrderFormData) => {
    if (!user) {
      setSubmitError('You must be logged in to submit an order')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          customer_name: data.customer_name,
          customer_email: data.customer_email,
          customer_phone: data.customer_phone,
          customer_role: data.customer_role,
          property_street: data.property_street,
          property_city: data.property_city,
          property_state: data.property_state,
          property_zip: data.property_zip,
          property_type: data.property_type,
          closing_type: data.closing_type,
          estimated_closing_date: data.estimated_closing_date || null,
          sale_amount: data.sale_amount ? parseFloat(data.sale_amount) : null,
          law_firm_id: lawFirm.id,
          office_location_id: data.office_location_id || null,
          notes: data.notes || null,
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/customer/orders/${order.id}`)
    } catch (error) {
      console.error('Error submitting order:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const officeOptions = lawFirm.office_locations?.map((loc) => ({
    value: loc.id,
    label: `${loc.name} - ${loc.city}, ${loc.state}`,
  })) || []

  const selectedOffice = lawFirm.office_locations?.find(
    (loc) => loc.id === lawFirm.office_locations?.find((l) => l.is_primary)?.id
  ) || lawFirm.office_locations?.[0]

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/search"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Search
      </Link>

      {/* Law Firm Info Card */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start gap-4">
          {lawFirm.logo_url ? (
            <img
              src={lawFirm.logo_url}
              alt={`${lawFirm.name} logo`}
              className="w-16 h-16 object-contain rounded-lg border border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 bg-brand-blue/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-8 w-8 text-brand-blue" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{lawFirm.name}</h2>
            <p className="text-gray-600">{lawFirm.phone}</p>
            <p className="text-gray-600">{lawFirm.email}</p>
            {selectedOffice && (
              <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>
                  {selectedOffice.street_address}, {selectedOffice.city}, {selectedOffice.state} {selectedOffice.zip_code}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Form */}
      <div className="bg-white border rounded-lg p-6">

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Your Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                {...register('customer_name', { required: 'Name is required' })}
                error={errors.customer_name?.message}
              />
              <Input
                label="Email"
                type="email"
                {...register('customer_email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                error={errors.customer_email?.message}
              />
              <Input
                label="Phone"
                type="tel"
                {...register('customer_phone', { required: 'Phone is required' })}
                error={errors.customer_phone?.message}
              />
              <Select
                label="Your Role"
                options={customerRoleOptions}
                {...register('customer_role', { required: 'Role is required' })}
                error={errors.customer_role?.message}
              />
            </div>
          </div>

          {/* Property Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Property Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Street Address"
                {...register('property_street', { required: 'Street address is required' })}
                error={errors.property_street?.message}
                placeholder="123 Main Street"
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <Input
                    label="City"
                    {...register('property_city', { required: 'City is required' })}
                    error={errors.property_city?.message}
                  />
                </div>
                <Select
                  label="State"
                  options={stateOptions}
                  {...register('property_state', { required: 'State is required' })}
                  error={errors.property_state?.message}
                />
                <Input
                  label="ZIP Code"
                  {...register('property_zip', {
                    required: 'ZIP code is required',
                    pattern: {
                      value: /^\d{5}(-\d{4})?$/,
                      message: 'Invalid ZIP code',
                    },
                  })}
                  error={errors.property_zip?.message}
                  placeholder="28202"
                />
              </div>
              <Select
                label="Property Type"
                options={propertyTypeOptions}
                {...register('property_type', { required: 'Property type is required' })}
                error={errors.property_type?.message}
              />
            </div>
          </div>

          {/* Closing Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Closing Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Closing Type"
                options={closingTypeOptions}
                {...register('closing_type', { required: 'Closing type is required' })}
                error={errors.closing_type?.message}
              />
              <Input
                label="Estimated Closing Date"
                type="date"
                {...register('estimated_closing_date')}
                error={errors.estimated_closing_date?.message}
              />
              <Input
                label="Sale Amount (Optional)"
                type="number"
                {...register('sale_amount')}
                error={errors.sale_amount?.message}
                placeholder="250000"
              />
              {officeOptions.length > 1 && (
                <Select
                  label="Preferred Office"
                  options={officeOptions}
                  {...register('office_location_id')}
                  error={errors.office_location_id?.message}
                />
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Additional Notes
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                {...register('notes')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                placeholder="Any additional information about your closing..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full bg-brand-blue hover:bg-brand-blue-light text-white py-3 text-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Closing Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

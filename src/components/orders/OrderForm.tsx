'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Button, Input, Select, AddressAutocomplete, CurrencyInput } from '@/components/ui'
import { LawFirm } from '@/types'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Trash2,
  Upload,
  User,
  Home,
  Briefcase,
  DollarSign,
  FileText,
  Send,
  Users,
  HelpCircle,
  Check,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

// Party role options
const partyRoleOptions = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'real_estate_agent_buyer', label: 'Real Estate Agent (Buyer)' },
  { value: 'real_estate_agent_seller', label: 'Real Estate Agent (Seller)' },
  { value: 'closing_coordinator', label: 'Closing Coordinator' },
  { value: 'lender', label: 'Lender' },
  { value: 'loan_processor', label: 'Loan Processor' },
  { value: 'law_firm', label: 'Law Firm' },
  { value: 'paralegal', label: 'Paralegal' },
  { value: 'title_search', label: 'Title Search' },
  { value: 'title_insurance', label: 'Title Insurance' },
  { value: 'notary_buyer', label: 'Notary (Buyer)' },
  { value: 'notary_seller', label: 'Notary (Seller)' },
]

const financingTypeOptions = [
  { value: 'cash', label: 'Cash Sale' },
  { value: 'conventional', label: 'Conventional Loan' },
  { value: 'fha', label: 'FHA Loan' },
  { value: 'va', label: 'VA Loan' },
  { value: 'usda', label: 'USDA Loan' },
  { value: 'hard_money', label: 'Hard Money Loan' },
  { value: 'seller_financing', label: 'Seller Financing' },
  { value: 'other', label: 'Other' },
]

const closingTypeOptions = [
  { value: 'purchase', label: 'Purchase / Sale' },
  { value: 'refinance', label: 'Refinance' },
  { value: 'heloc', label: 'HELOC' },
  { value: 'construction', label: 'Construction Loan' },
  { value: 'other', label: 'Other' },
]

const stateOptions = [
  { value: 'NC', label: 'North Carolina' },
  { value: 'SC', label: 'South Carolina' },
]

const earnestMoneyHeldByOptions = [
  { value: 'law_firm', label: 'Law Firm' },
  { value: 'listing_agent', label: 'Listing Agent' },
  { value: 'buyer_agent', label: 'Buyer Agent' },
  { value: 'escrow_company', label: 'Escrow Company' },
  { value: 'title_company', label: 'Title Company' },
  { value: 'other', label: 'Other' },
]

interface PartyInvite {
  role: string
  email: string
  first_name: string
  last_name: string
  company: string
  phone: string
}

interface OrderFormData {
  financing_type: string
  closing_type: string
  property_street: string
  property_unit: string
  property_city: string
  property_state: string
  property_zip: string
  sale_price: string
  due_diligence_fee: string
  due_diligence_date: string
  seller_credits: string
  home_warranty_credit: string
  earnest_money: string
  earnest_money_held_by: string
  notes: string
  promo_code: string
  parties: PartyInvite[]
}

interface OrderFormProps {
  lawFirm: LawFirm
}

export function OrderForm({ lawFirm }: OrderFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { user, profile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [activeTab, setActiveTab] = useState<'details' | 'parties'>('details')

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<OrderFormData>({
    defaultValues: {
      financing_type: 'cash',
      closing_type: 'purchase',
      property_street: '',
      property_unit: '',
      property_city: '',
      property_state: 'NC',
      property_zip: '',
      sale_price: '',
      due_diligence_fee: '',
      due_diligence_date: '',
      seller_credits: '',
      home_warranty_credit: '',
      earnest_money: '',
      earnest_money_held_by: '',
      notes: '',
      promo_code: '',
      parties: [
        {
          role: 'buyer',
          email: profile?.email || user?.email || '',
          first_name: profile?.full_name?.split(' ')[0] || '',
          last_name: profile?.full_name?.split(' ').slice(1).join(' ') || '',
          company: '',
          phone: profile?.phone || '',
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'parties',
  })

  const watchClosingType = watch('closing_type')
  const watchFinancingType = watch('financing_type')
  const watchPropertyStreet = watch('property_street')
  const watchSalePrice = watch('sale_price')
  const watchDueDiligenceFee = watch('due_diligence_fee')
  const watchSellerCredits = watch('seller_credits')
  const watchHomeWarrantyCredit = watch('home_warranty_credit')
  const watchEarnestMoney = watch('earnest_money')

  const handleAddressSelect = (address: {
    street: string
    city: string
    state: string
    zip: string
    full_address: string
  }) => {
    setValue('property_street', address.street, { shouldValidate: true })
    setValue('property_city', address.city, { shouldValidate: true })
    setValue('property_zip', address.zip, { shouldValidate: true })
    // Only set state if it's NC or SC (our supported states)
    if (address.state === 'NC' || address.state === 'SC') {
      setValue('property_state', address.state, { shouldValidate: true })
    }
  }

  const selectedOffice = lawFirm.office_locations?.find(
    (loc) => loc.is_primary
  ) || lawFirm.office_locations?.[0]

  const handleNextTab = async () => {
    // Validate the first tab fields before moving to next
    const isValid = await trigger(['property_street', 'property_city', 'property_zip', 'property_state', 'financing_type'])
    if (isValid) {
      setActiveTab('parties')
    }
  }

  const onSubmit = async (data: OrderFormData) => {
    if (!user) {
      setSubmitError('You must be logged in to submit an order')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const fileStarter = data.parties[0]

      // Create the order with all new fields
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          customer_name: `${fileStarter.first_name} ${fileStarter.last_name}`.trim(),
          customer_email: fileStarter.email,
          customer_phone: fileStarter.phone,
          customer_role: fileStarter.role,
          property_street: data.property_street,
          property_unit: data.property_unit || null,
          property_city: data.property_city,
          property_state: data.property_state,
          property_zip: data.property_zip,
          property_type: 'residential',
          closing_type: data.closing_type,
          financing_type: data.financing_type,
          sale_amount: data.sale_price ? parseFloat(data.sale_price) : null,
          due_diligence_fee: data.due_diligence_fee ? parseFloat(data.due_diligence_fee) : null,
          due_diligence_date: data.due_diligence_date || null,
          seller_credits: data.seller_credits ? parseFloat(data.seller_credits) : null,
          home_warranty_credit: data.home_warranty_credit ? parseFloat(data.home_warranty_credit) : null,
          earnest_money: data.earnest_money ? parseFloat(data.earnest_money) : null,
          earnest_money_held_by: data.earnest_money_held_by || null,
          promo_code: data.promo_code || null,
          law_firm_id: lawFirm.id,
          office_location_id: selectedOffice?.id || null,
          notes: data.notes || null,
        })
        .select()
        .single()

      if (error) throw error

      // Insert all order parties
      if (data.parties.length > 0) {
        const orderParties = data.parties.map(party => ({
          order_id: order.id,
          role: party.role,
          email: party.email,
          first_name: party.first_name || null,
          last_name: party.last_name || null,
          company: party.company || null,
          phone: party.phone || null,
          invite_status: 'pending',
        }))

        const { error: partiesError } = await supabase
          .from('order_parties')
          .insert(orderParties)

        if (partiesError) {
          console.error('Error inserting order parties:', partiesError)
          // Don't fail the whole order if parties fail to save
        }
      }

      router.push(`/order/success?order=${order.order_number}`)
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string; details?: string; hint?: string }
      console.error('Error submitting order:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        full: JSON.stringify(error, null, 2)
      })
      setSubmitError(err?.message || 'Failed to submit order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles([...attachedFiles, ...Array.from(e.target.files)])
    }
  }

  const removeFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Header Breadcrumb */}
      <div className="bg-white border rounded-lg px-4 py-3">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Link href="/search" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{lawFirm.name}</span>
          {selectedOffice && (
            <>
              <MapPin className="h-4 w-4 text-gray-400 ml-2" />
              <span className="text-gray-600">{selectedOffice.city}</span>
              <MapPin className="h-4 w-4 text-gray-400 ml-2" />
              <span className="text-gray-600">
                {selectedOffice.street_address}, {selectedOffice.city}, {selectedOffice.state} {selectedOffice.zip_code}
              </span>
            </>
          )}
          <FileText className="h-4 w-4 text-gray-400 ml-2" />
          <span className="text-gray-600">
            {closingTypeOptions.find(o => o.value === watchClosingType)?.label || 'Purchase / Sale'}
          </span>
          <DollarSign className="h-4 w-4 text-gray-400 ml-2" />
          <span className="text-gray-600">
            {financingTypeOptions.find(o => o.value === watchFinancingType)?.label || 'Cash Sale'}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border rounded-lg">
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {activeTab === 'parties' && (
              <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </span>
            )}
            <span>Transaction Details</span>
            {activeTab === 'details' && <ChevronRight className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => activeTab === 'parties' ? null : handleNextTab()}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'parties'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>Invite Parties</span>
          </button>
        </div>
      </div>

      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tab 1: Transaction Details */}
        {activeTab === 'details' && (
          <>
            {/* Financing Type */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">
                  Financing Type <span className="text-red-500">*</span>
                </label>
              </div>
              <Select
                options={financingTypeOptions}
                {...register('financing_type', { required: 'Financing type is required' })}
                error={errors.financing_type?.message}
              />
            </div>

            {/* Subject Property Information */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Subject Property Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <AddressAutocomplete
                    label="Subject Primary Address"
                    placeholder="Start typing an address..."
                    value={watchPropertyStreet}
                    onChange={(value) => setValue('property_street', value)}
                    onAddressSelect={handleAddressSelect}
                    error={errors.property_street?.message}
                    required
                  />
                  <input type="hidden" {...register('property_street', { required: 'Address is required' })} />
                </div>
                <Input
                  label="City"
                  placeholder="Charlotte"
                  {...register('property_city', { required: 'City is required' })}
                  error={errors.property_city?.message}
                  required
                />
                <Input
                  label="Unit, Suite, etc."
                  placeholder="Enter unit, suite, etc."
                  {...register('property_unit')}
                />
                <Input
                  label="Zip Code"
                  placeholder="28269"
                  {...register('property_zip', { required: 'ZIP code is required' })}
                  error={errors.property_zip?.message}
                  required
                />
                <Select
                  label="State"
                  options={stateOptions}
                  {...register('property_state', { required: 'State is required' })}
                  error={errors.property_state?.message}
                  required
                />
              </div>
            </div>

            {/* Transaction Summary */}
            <div className="bg-white border rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Transaction Summary: {closingTypeOptions.find(o => o.value === watchClosingType)?.label || 'Purchase / Sale'}, {financingTypeOptions.find(o => o.value === watchFinancingType)?.label || 'Cash Sale'}
                </h3>
                <p className="text-sm text-gray-500">The fields below are optional. This information can always be added or changed later.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CurrencyInput
                  label="Purchase / Sale Price"
                  placeholder="0.00"
                  value={watchSalePrice}
                  onChange={(value) => setValue('sale_price', value)}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Diligence Fee
                    <HelpCircle className="inline h-4 w-4 text-gray-400 ml-1" />
                  </label>
                  <CurrencyInput
                    placeholder="0.00"
                    value={watchDueDiligenceFee}
                    onChange={(value) => setValue('due_diligence_fee', value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Diligence Date
                    <HelpCircle className="inline h-4 w-4 text-gray-400 ml-1" />
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    {...register('due_diligence_date')}
                  />
                </div>
                <CurrencyInput
                  label="Seller Credits to Buyer"
                  placeholder="0.00"
                  value={watchSellerCredits}
                  onChange={(value) => setValue('seller_credits', value)}
                />
                <CurrencyInput
                  label="Home Warranty Credit to Buyer"
                  placeholder="0.00"
                  value={watchHomeWarrantyCredit}
                  onChange={(value) => setValue('home_warranty_credit', value)}
                />
                <CurrencyInput
                  label="Earnest Money Deposit"
                  placeholder="0.00"
                  value={watchEarnestMoney}
                  onChange={(value) => setValue('earnest_money', value)}
                />
                <div>
                  <Select
                    label="Earnest Money Held By"
                    options={[{ value: '', label: 'Select earnest money held by' }, ...earnestMoneyHeldByOptions]}
                    {...register('earnest_money_held_by')}
                  />
                </div>
              </div>
            </div>

            {/* Upload Documents */}
            <div className="bg-white border rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Upload Documents <span className="text-gray-400 font-normal">(Shared to All Parties)</span></h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Ex. Purchase Agreement, All Addendums to the contract, Copies of EMD and DD Deposit Form Signed by all, etc)
                    </p>
                    <p className="text-sm text-amber-600 mb-3">
                      Warning: Anything you upload in this section can be seen by ALL Parties
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      <span>Attach Files</span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileAttach}
                      />
                    </label>
                    {attachedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {attachedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Transaction Notes</h3>
                  <textarea
                    className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[160px]"
                    placeholder="Details, instructions, notes, requests, etc..."
                    {...register('notes')}
                  />
                </div>
              </div>
            </div>

            {/* Promo Code */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700">Promo Code</label>
                <HelpCircle className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                placeholder="Enter promo code"
                {...register('promo_code')}
              />
            </div>

            {/* Next Button */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <Link href="/search" className="text-gray-600 hover:text-gray-900">
                  Cancel
                </Link>
                <Button
                  type="button"
                  onClick={handleNextTab}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                >
                  Continue to Invite Parties
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Invite Parties */}
        {activeTab === 'parties' && (
          <>
            {/* Parties Section */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-6">Invite Transaction Parties</h3>
              <p className="text-sm text-gray-500 mb-6">Add all parties involved in this transaction. They will receive an invitation to collaborate on this closing.</p>

              {/* Buyer Side Parties */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Buyer Side Parties</h4>
                <div className="flex flex-wrap gap-3 mb-4">
                  {[
                    { value: 'buyer', label: 'Buyer', icon: User },
                    { value: 'real_estate_agent_buyer', label: 'Real Estate Agent', icon: Home },
                    { value: 'closing_coordinator', label: 'Closing Coordinator', icon: Users },
                    { value: 'lender', label: 'Lender', icon: DollarSign },
                    { value: 'loan_processor', label: 'Loan Processor', icon: FileText },
                    { value: 'law_firm', label: 'Law Firm', icon: Building2 },
                    { value: 'paralegal', label: 'Paralegal', icon: Briefcase },
                  ].map((party) => {
                    const PartyIcon = party.icon
                    const count = fields.filter(f => f.role === party.value).length
                    return (
                      <button
                        key={party.value}
                        type="button"
                        onClick={() => append({
                          role: party.value,
                          email: '',
                          first_name: '',
                          last_name: '',
                          company: '',
                          phone: '',
                        })}
                        className={`flex flex-col items-center p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors min-w-[100px] ${
                          count > 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="relative">
                          <PartyIcon className={`h-6 w-6 ${count > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                          {count > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                              {count}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs mt-1 text-center ${count > 0 ? 'text-blue-600' : 'text-gray-600'}`}>{party.label}</span>
                        <span className="text-xs text-blue-600 mt-1">Add +</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Seller Side Parties */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Seller Side Parties</h4>
                <div className="flex flex-wrap gap-3 mb-4">
                  {[
                    { value: 'seller', label: 'Seller', icon: User },
                    { value: 'real_estate_agent_seller', label: 'Real Estate Agent', icon: Home },
                    { value: 'closing_coordinator_seller', label: 'Closing Coordinator', icon: Users },
                    { value: 'law_firm_seller', label: 'Law Firm', icon: Building2 },
                    { value: 'paralegal_seller', label: 'Paralegal', icon: Briefcase },
                  ].map((party) => {
                    const PartyIcon = party.icon
                    const count = fields.filter(f => f.role === party.value).length
                    return (
                      <button
                        key={party.value}
                        type="button"
                        onClick={() => append({
                          role: party.value,
                          email: '',
                          first_name: '',
                          last_name: '',
                          company: '',
                          phone: '',
                        })}
                        className={`flex flex-col items-center p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors min-w-[100px] ${
                          count > 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="relative">
                          <PartyIcon className={`h-6 w-6 ${count > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                          {count > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                              {count}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs mt-1 text-center ${count > 0 ? 'text-blue-600' : 'text-gray-600'}`}>{party.label}</span>
                        <span className="text-xs text-blue-600 mt-1">Add +</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Vendors */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Vendors</h4>
                <div className="flex flex-wrap gap-3 mb-4">
                  {[
                    { value: 'title_search', label: 'Title Search', icon: FileText },
                    { value: 'title_insurance', label: 'Title Insurance', icon: FileText },
                    { value: 'notary_buyer', label: 'Notary (Buyer)', icon: FileText },
                    { value: 'notary_seller', label: 'Notary (Seller)', icon: FileText },
                  ].map((party) => {
                    const PartyIcon = party.icon
                    const count = fields.filter(f => f.role === party.value).length
                    return (
                      <button
                        key={party.value}
                        type="button"
                        onClick={() => append({
                          role: party.value,
                          email: '',
                          first_name: '',
                          last_name: '',
                          company: '',
                          phone: '',
                        })}
                        className={`flex flex-col items-center p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors min-w-[100px] ${
                          count > 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="relative">
                          <PartyIcon className={`h-6 w-6 ${count > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                          {count > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                              {count}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs mt-1 text-center ${count > 0 ? 'text-blue-600' : 'text-gray-600'}`}>{party.label}</span>
                        <span className="text-xs text-blue-600 mt-1">Add +</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Party List Cards */}
              {fields.length > 0 && (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
                      {/* Header row with role, status, and actions */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <select
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-medium min-w-[200px]"
                            {...register(`parties.${index}.role`)}
                          >
                            {partyRoleOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full font-medium">
                            Pending
                          </span>
                          <button
                            type="button"
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Send Invite"
                          >
                            <Send className="h-5 w-5" />
                          </button>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove Party"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Form fields in two rows */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Row 1 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="email@example.com"
                            {...register(`parties.${index}.email`)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="First name"
                            {...register(`parties.${index}.first_name`)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Last name"
                            {...register(`parties.${index}.last_name`)}
                          />
                        </div>
                        {/* Row 2 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Company name"
                            {...register(`parties.${index}.company`)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Phone</label>
                          <input
                            type="tel"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="(123) 456-7890"
                            {...register(`parties.${index}.phone`)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => append({
                  role: 'buyer',
                  email: '',
                  first_name: '',
                  last_name: '',
                  company: '',
                  phone: '',
                })}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Add Party +
              </button>
            </div>

            {/* Submit Actions */}
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Transaction Details
                </button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Closing Request'}
                </Button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  )
}

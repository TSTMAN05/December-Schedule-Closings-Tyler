'use client'

import { Transaction } from '@/types'
import {
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Building2,
  User,
  Clock,
} from 'lucide-react'

interface SummaryTabProps {
  transaction: Transaction
}

export function SummaryTab({ transaction }: SummaryTabProps) {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'TBD'
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (time: string | null) => {
    if (!time) return 'TBD'
    return time
  }

  const getDealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: 'Purchase / Sale',
      refinance: 'Refinance',
      heloc: 'HELOC',
      other: 'Other',
    }
    return labels[type] || type
  }

  const getFinancingLabel = (type: string | null) => {
    if (!type) return 'Not specified'
    const labels: Record<string, string> = {
      cash: 'Cash',
      conventional: 'Conventional Loan',
      fha: 'FHA Loan',
      va: 'VA Loan',
      usda: 'USDA Loan',
      hard_money: 'Hard Money',
      seller_financing: 'Seller Financing',
    }
    return labels[type] || type
  }

  const buyerParties = transaction.parties?.filter((p) => p.side === 'buyer') || []
  const sellerParties = transaction.parties?.filter((p) => p.side === 'seller') || []

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Information */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-400" />
            Property Information
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Address</label>
              <p className="font-medium text-gray-900">
                {transaction.property_address}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-500">City</label>
                <p className="font-medium text-gray-900">{transaction.property_city}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">State</label>
                <p className="font-medium text-gray-900">{transaction.property_state}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">ZIP</label>
                <p className="font-medium text-gray-900">{transaction.property_zip}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-400" />
            Transaction Details
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Deal Number</label>
                <p className="font-medium text-gray-900">{transaction.deal_number}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Deal Type</label>
                <p className="font-medium text-gray-900">
                  {getDealTypeLabel(transaction.deal_type)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Financing</label>
                <p className="font-medium text-gray-900">
                  {getFinancingLabel(transaction.financing_type)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Sale Price</label>
                <p className="font-medium text-gray-900">
                  {formatCurrency(transaction.sale_price)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Closing Information */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            Closing Information
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Closing Date</label>
                <p className="font-medium text-gray-900">
                  {formatDate(transaction.closing_date)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Closing Time</label>
                <p className="font-medium text-gray-900">
                  {formatTime(transaction.closing_time)}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Closing Location</label>
              <p className="font-medium text-gray-900">
                {transaction.closing_location || 'TBD'}
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            Status & Timeline
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Current Status</label>
              <p className="font-medium text-gray-900 capitalize">
                {transaction.status.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Created</label>
                <p className="font-medium text-gray-900">
                  {new Date(transaction.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Last Updated</label>
                <p className="font-medium text-gray-900">
                  {new Date(transaction.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parties Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buyer Side */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            Buyer Side Parties
          </h3>
          {buyerParties.length === 0 ? (
            <p className="text-gray-500 text-sm">No buyer side parties added yet</p>
          ) : (
            <div className="space-y-3">
              {buyerParties.map((party) => (
                <div
                  key={party.id}
                  className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {party.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{party.name}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {party.role.replace(/_/g, ' ')}
                      {party.company && ` at ${party.company}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seller Side */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-green-500" />
            Seller Side Parties
          </h3>
          {sellerParties.length === 0 ? (
            <p className="text-gray-500 text-sm">No seller side parties added yet</p>
          ) : (
            <div className="space-y-3">
              {sellerParties.map((party) => (
                <div
                  key={party.id}
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-green-600">
                      {party.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{party.name}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {party.role.replace(/_/g, ' ')}
                      {party.company && ` at ${party.company}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

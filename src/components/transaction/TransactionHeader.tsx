'use client'

import { Transaction, TransactionStatus } from '@/types'
import { TransactionStatusFlow } from './TransactionStatusFlow'
import {
  FileText,
  Calendar,
  Users,
  Building2,
  MapPin,
  DollarSign,
} from 'lucide-react'
import Image from 'next/image'

interface TransactionHeaderProps {
  transaction: Transaction
  userRole?: string
  onStatusChange?: (status: TransactionStatus) => void
}

export function TransactionHeader({
  transaction,
  userRole,
  onStatusChange,
}: TransactionHeaderProps) {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'TBD'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
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
    if (!type) return ''
    const labels: Record<string, string> = {
      cash: 'Cash',
      conventional: 'Conventional',
      fha: 'FHA',
      va: 'VA',
      usda: 'USDA',
      hard_money: 'Hard Money',
      seller_financing: 'Seller Financing',
    }
    return labels[type] || type
  }

  return (
    <div className="bg-white border-b">
      {/* Top section - Property and user info */}
      <div className="px-6 py-4">
        <div className="flex items-start justify-between">
          {/* Left side - Property info */}
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {transaction.property_address}, {transaction.property_city}, {transaction.property_state} {transaction.property_zip}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {transaction.deal_number}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {getDealTypeLabel(transaction.deal_type)}
                {transaction.financing_type && ` (${getFinancingLabel(transaction.financing_type)})`}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(transaction.closing_date)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Appointments
              </span>
            </div>
          </div>

          {/* Right side - User info */}
          {userRole && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{userRole}</div>
                <div className="text-xs text-gray-500">Buyer Attorney</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                <Image
                  src="/placeholder-avatar.png"
                  alt="User"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Buyer and Seller sides */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          {/* Buyer Side */}
          <div className="flex items-center gap-6">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Buyer Side
              {transaction.parties?.find(p => p.role === 'buyer') && (
                <span className="ml-2 text-gray-400 font-normal normal-case">
                  - {transaction.parties.find(p => p.role === 'buyer')?.email}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* Law Firm */}
              {transaction.buyer_side_law_firm ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.buyer_side_law_firm.name}
                    </div>
                    <a
                      href={`/law-firms/${transaction.buyer_side_law_firm.slug}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View Page
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">No Law Firm</div>
                  </div>
                </div>
              )}
              {/* Paralegal */}
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Users className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <div className="text-gray-500">
                    {transaction.buyer_side_paralegal?.profile?.full_name || 'Unassigned'}
                  </div>
                  <div className="text-gray-400 text-xs">Paralegal</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <button className="text-blue-600 hover:underline text-xs">Assign</button>
                <span className="text-gray-300">|</span>
                <button className="text-gray-400 hover:text-gray-600 text-xs">Unassign</button>
              </div>
            </div>
          </div>

          {/* Seller Side */}
          <div className="flex items-center gap-6">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Seller Side
            </div>
            <div className="flex items-center gap-4">
              {/* Law Firm */}
              {transaction.seller_side_law_firm ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <Building2 className="h-4 w-4 text-gray-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.seller_side_law_firm.name}
                    </div>
                    <a
                      href={`/law-firms/${transaction.seller_side_law_firm.slug}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View Page
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200 border-dashed">
                  <Building2 className="h-4 w-4 text-amber-500" />
                  <div>
                    <div className="text-sm text-amber-700">No Attorney Selected</div>
                    <button className="text-xs text-blue-600 hover:underline">
                      Invite Attorney
                    </button>
                  </div>
                </div>
              )}
              {/* Paralegal - only show if there's a law firm */}
              {transaction.seller_side_law_firm && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <div className="text-gray-500">
                        {transaction.seller_side_paralegal?.profile?.full_name || 'Unassigned'}
                      </div>
                      <div className="text-gray-400 text-xs">Paralegal</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <button className="text-blue-600 hover:underline text-xs">Assign</button>
                    <span className="text-gray-300">|</span>
                    <button className="text-gray-400 hover:text-gray-600 text-xs">Unassign</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status flow */}
      <div className="px-6 py-3 bg-gray-50 border-t">
        <TransactionStatusFlow
          currentStatus={transaction.status}
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  )
}

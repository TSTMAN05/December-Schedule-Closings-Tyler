'use client'

import { useState } from 'react'
import { Transaction, TransactionTab, TransactionStatus } from '@/types'
import { TransactionHeader } from './TransactionHeader'
import { TransactionTabs } from './TransactionTabs'
import { ChatsTab, SummaryTab, PlaceholderTab } from './tabs'
import { X } from 'lucide-react'

interface TransactionWindowProps {
  transaction: Transaction
  currentUserId: string
  userRole?: string
  onClose?: () => void
  onStatusChange?: (status: TransactionStatus) => void
  onSendMessage?: (recipientId: string, content: string) => void
}

export function TransactionWindow({
  transaction,
  currentUserId,
  userRole,
  onClose,
  onStatusChange,
  onSendMessage,
}: TransactionWindowProps) {
  const [activeTab, setActiveTab] = useState<TransactionTab>('summary')

  // Calculate badge counts
  const badges: Partial<Record<TransactionTab, number>> = {
    chats: transaction.messages?.filter((m) => !m.is_read && m.recipient_id === currentUserId).length || 0,
    tasks: 2, // Example - would come from actual data
    parties: transaction.parties?.length || 0,
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return <SummaryTab transaction={transaction} />
      case 'chats':
        return (
          <ChatsTab
            parties={transaction.parties || []}
            messages={transaction.messages || []}
            currentUserId={currentUserId}
            onSendMessage={onSendMessage}
          />
        )
      default:
        return <PlaceholderTab tab={activeTab} />
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Close button - for modal usage */}
      {onClose && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <TransactionHeader
        transaction={transaction}
        userRole={userRole}
        onStatusChange={onStatusChange}
      />

      {/* Tabs */}
      <TransactionTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        badges={badges}
      />

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {renderTabContent()}
      </div>

      {/* Footer with Close/Cancel buttons */}
      <div className="border-t bg-white px-6 py-4 flex justify-between items-center">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

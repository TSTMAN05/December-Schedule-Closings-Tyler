'use client'

import { useState } from 'react'
import { TransactionParty, TransactionMessage } from '@/types'
import { Search, Send, MessageCircle } from 'lucide-react'
import Image from 'next/image'

interface ChatsTabProps {
  parties: TransactionParty[]
  messages: TransactionMessage[]
  currentUserId: string
  onSendMessage?: (recipientId: string, content: string) => void
}

export function ChatsTab({
  parties,
  messages,
  currentUserId,
  onSendMessage,
}: ChatsTabProps) {
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')

  // Filter parties based on search
  const filteredParties = parties.filter((party) =>
    party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    party.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get messages for selected conversation
  const conversationMessages = selectedPartyId
    ? messages.filter(
        (msg) =>
          (msg.sender_id === currentUserId && msg.recipient_id === selectedPartyId) ||
          (msg.sender_id === selectedPartyId && msg.recipient_id === currentUserId)
      )
    : []

  const selectedParty = parties.find((p) => p.id === selectedPartyId)

  const handleSendMessage = () => {
    if (!selectedPartyId || !messageInput.trim() || !onSendMessage) return
    onSendMessage(selectedPartyId, messageInput.trim())
    setMessageInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      buyer: 'Buyer',
      seller: 'Seller',
      buyer_attorney: 'Buyer Attorney',
      seller_attorney: 'Seller Attorney',
      buyer_paralegal: 'Buyer Paralegal',
      seller_paralegal: 'Seller Paralegal',
      buyer_agent: 'Buyer Agent',
      seller_agent: 'Seller Agent',
      lender: 'Lender',
      loan_processor: 'Loan Processor',
      title_agent: 'Title Agent',
      notary: 'Notary',
      closing_coordinator: 'Closing Coordinator',
    }
    return labels[role] || role
  }

  return (
    <div className="flex h-[calc(100vh-320px)] min-h-[500px] bg-white rounded-lg border">
      {/* Left sidebar - Party list */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Transaction Chats
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Party"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Party list */}
        <div className="flex-1 overflow-y-auto">
          {filteredParties.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No parties found
            </div>
          ) : (
            filteredParties.map((party) => {
              const isSelected = selectedPartyId === party.id
              const hasUnread = messages.some(
                (msg) =>
                  msg.sender_id === party.id &&
                  msg.recipient_id === currentUserId &&
                  !msg.is_read
              )

              return (
                <button
                  key={party.id}
                  onClick={() => setSelectedPartyId(party.id)}
                  className={`w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors border-b ${
                    isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {party.profile?.avatar_url ? (
                        <Image
                          src={party.profile.avatar_url}
                          alt={party.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {party.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Party info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium text-sm ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                        {party.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {party.company || 'Send message to start the conversation'}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right side - Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedParty ? (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {selectedParty.profile?.avatar_url ? (
                  <Image
                    src={selectedParty.profile.avatar_url}
                    alt={selectedParty.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {selectedParty.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">{selectedParty.name}</div>
                <div className="text-xs text-gray-500">{getRoleLabel(selectedParty.role)}</div>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversationMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <MessageCircle className="h-12 w-12 mb-3" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs">Start the conversation below</p>
                </div>
              ) : (
                conversationMessages.map((msg) => {
                  const isOwn = msg.sender_id === currentUserId
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? 'text-blue-100' : 'text-gray-400'
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Message input */}
            <div className="p-4 border-t">
              <div className="flex items-end gap-2">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-10 w-10" />
            </div>
            <p className="text-lg font-medium text-gray-600 mb-1">
              Select a party from the left side and begin your conversation.
            </p>
            <p className="text-sm text-gray-400">
              Messages are transaction-scoped and logged to deal history
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

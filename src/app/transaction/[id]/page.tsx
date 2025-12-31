'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { TransactionWindow } from '@/components/transaction'
import { Transaction, TransactionStatus, TransactionParty, Order, LawFirm } from '@/types'
import { Spinner } from '@/components/ui'

// Map order status to transaction status
function mapOrderStatusToTransactionStatus(orderStatus: string): TransactionStatus {
  switch (orderStatus) {
    case 'new':
      return 'new'
    case 'in_progress':
      return 'in_progress'
    case 'completed':
      return 'complete'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'new'
  }
}

// Build parties list from order data
function buildPartiesFromOrder(order: Order, orderId: string): TransactionParty[] {
  const parties: TransactionParty[] = []
  const now = new Date().toISOString()

  // Add buyer (customer who placed the order, if they're the buyer)
  if (order.customer_role === 'buyer' || order.buyer_name) {
    parties.push({
      id: `party-buyer-${orderId}`,
      transaction_id: orderId,
      profile_id: order.customer_id || null,
      role: 'buyer',
      side: 'buyer',
      name: order.buyer_name || order.customer_name || 'Buyer',
      email: order.customer_email || '',
      phone: order.customer_phone || null,
      company: null,
      is_primary: true,
      can_edit: false,
      can_view_documents: true,
      can_message: true,
      created_at: now,
      updated_at: now,
    })
  }

  // Add seller
  if (order.seller_name) {
    parties.push({
      id: `party-seller-${orderId}`,
      transaction_id: orderId,
      profile_id: null,
      role: 'seller',
      side: 'seller',
      name: order.seller_name,
      email: '',
      phone: null,
      company: null,
      is_primary: true,
      can_edit: false,
      can_view_documents: true,
      can_message: true,
      created_at: now,
      updated_at: now,
    })
  }

  // Add law firm as buyer attorney (since orders are placed with a law firm)
  if (order.law_firm) {
    parties.push({
      id: `party-attorney-${orderId}`,
      transaction_id: orderId,
      profile_id: order.law_firm.owner_id || null,
      role: 'buyer_attorney',
      side: 'buyer',
      name: order.assigned_attorney?.profile?.full_name || order.law_firm.name,
      email: order.law_firm.email,
      phone: order.law_firm.phone || null,
      company: order.law_firm.name,
      is_primary: false,
      can_edit: true,
      can_view_documents: true,
      can_message: true,
      created_at: now,
      updated_at: now,
    })
  }

  return parties
}

export default function TransactionPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orderId = params.id as string

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/search')
      return
    }

    const loadOrder = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Fetch the order with related data
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            law_firm:law_firms!law_firm_id (
              id,
              owner_id,
              name,
              slug,
              email,
              phone,
              website,
              logo_url,
              description,
              status,
              is_disabled,
              disabled_at,
              disabled_reason,
              approved_at,
              approved_by,
              created_at,
              updated_at
            ),
            assigned_attorney:attorneys!assigned_attorney_id (
              id,
              profile_id,
              title,
              bar_number,
              is_active,
              profile:profiles!profile_id (
                id,
                full_name,
                email,
                phone
              )
            ),
            customer:profiles!customer_id (
              id,
              full_name,
              email,
              phone
            )
          `)
          .eq('id', orderId)
          .single()

        if (orderError) {
          console.error('Error fetching order:', orderError)
          setError('Order not found')
          return
        }

        if (!order) {
          setError('Order not found')
          return
        }

        // Transform order to transaction format
        const lawFirm = order.law_firm as LawFirm | null

        const transaction: Transaction = {
          id: order.id,
          order_id: order.id,
          deal_number: order.order_number,
          property_address: order.property_street,
          property_city: order.property_city,
          property_state: order.property_state,
          property_zip: order.property_zip,
          deal_type: order.closing_type,
          financing_type: order.financing_type || null,
          sale_price: order.sale_amount,
          closing_date: order.estimated_closing_date,
          closing_time: order.closing_time || null,
          closing_location: order.closing_location || null,
          status: mapOrderStatusToTransactionStatus(order.status),
          buyer_side_law_firm_id: order.law_firm_id,
          seller_side_law_firm_id: null,
          buyer_side_paralegal_id: null,
          seller_side_paralegal_id: null,
          created_at: order.created_at,
          updated_at: order.updated_at,
          buyer_side_law_firm: lawFirm || undefined,
          seller_side_law_firm: undefined,
          parties: buildPartiesFromOrder(order as Order, order.id),
          messages: [],
          documents: [],
          appointments: [],
          history: [],
        }

        setTransaction(transaction)
      } catch (err) {
        console.error('Error loading order:', err)
        setError('Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId, user, authLoading, router])

  const handleStatusChange = async (status: TransactionStatus) => {
    if (!transaction) return

    const supabase = createClient()

    // Map transaction status back to order status
    let orderStatus: string
    switch (status) {
      case 'new':
        orderStatus = 'new'
        break
      case 'in_progress':
      case 'ready_to_close':
        orderStatus = 'in_progress'
        break
      case 'closed':
      case 'post_closing':
      case 'complete':
        orderStatus = 'completed'
        break
      case 'cancelled':
        orderStatus = 'cancelled'
        break
      default:
        orderStatus = 'in_progress'
    }

    // Update order status in database
    const { error } = await supabase
      .from('orders')
      .update({ status: orderStatus })
      .eq('id', transaction.order_id)

    if (error) {
      console.error('Error updating status:', error)
      return
    }

    // Update local state
    setTransaction({ ...transaction, status })
  }

  const handleSendMessage = async (recipientId: string, content: string) => {
    if (!transaction || !user) return

    // TODO: Implement actual message sending via Supabase when messages table exists
    console.log('Send message:', { recipientId, content })

    // Optimistically add message to UI
    const newMessage = {
      id: `msg-${Date.now()}`,
      transaction_id: transaction.id,
      sender_id: user.id,
      recipient_id: recipientId,
      content,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
    }

    setTransaction({
      ...transaction,
      messages: [...(transaction.messages || []), newMessage],
    })
  }

  const handleClose = () => {
    router.back()
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Transaction not found'}
          </h2>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TransactionWindow
        transaction={transaction}
        currentUserId={user?.id || ''}
        userRole={user?.email || ''}
        onClose={handleClose}
        onStatusChange={handleStatusChange}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}

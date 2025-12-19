'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner, Badge, Card, CardContent } from '@/components/ui'
import { Order } from '@/types'
import { CheckCircle, ArrowLeft, Building2, MapPin, Calendar, DollarSign } from 'lucide-react'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orderId = params.id as string

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/search')
      return
    }

    if (authLoading || !user) return

    async function fetchOrder() {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          law_firm:law_firms (id, name, email, phone, logo_url),
          office_location:office_locations (id, name, street_address, city, state, zip_code)
        `)
        .eq('id', orderId)
        .single()

      if (fetchError || !data) {
        setError('Order not found.')
        setLoading(false)
        return
      }

      setOrder(data as Order)
      setLoading(false)
    }

    fetchOrder()
  }, [orderId, user, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Order not found.'}</p>
          <Link href="/customer" className="text-brand-blue hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'new':
        return 'warning'
      case 'in_progress':
        return 'info'
      case 'completed':
        return 'success'
      case 'cancelled':
        return 'danger'
      default:
        return 'default'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Success Banner - shown if order is new */}
      {order.status === 'new' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-800 mb-2">
            Order Submitted Successfully!
          </h1>
          <p className="text-green-700">
            Your closing request has been sent to {order.law_firm?.name}. They will contact you shortly.
          </p>
        </div>
      )}

      {/* Order Details Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="text-xl font-bold text-gray-900">{order.order_number}</p>
            </div>
            <Badge variant={getStatusColor(order.status)}>
              {formatStatus(order.status)}
            </Badge>
          </div>

          {/* Law Firm Info */}
          {order.law_firm && (
            <div className="border-t pt-4 mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Law Firm</h3>
              <div className="flex items-center gap-3">
                {order.law_firm.logo_url ? (
                  <img
                    src={order.law_firm.logo_url}
                    alt={order.law_firm.name}
                    className="w-10 h-10 object-contain rounded border"
                  />
                ) : (
                  <div className="w-10 h-10 bg-brand-blue/10 rounded flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-brand-blue" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{order.law_firm.name}</p>
                  <p className="text-sm text-gray-600">{order.law_firm.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* Property Info */}
          <div className="border-t pt-4 mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Property</h3>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-gray-900">{order.property_street}</p>
                <p className="text-gray-600">
                  {order.property_city}, {order.property_state} {order.property_zip}
                </p>
              </div>
            </div>
          </div>

          {/* Closing Details */}
          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Closing Type</h3>
              <p className="text-gray-900 capitalize">{order.closing_type}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Property Type</h3>
              <p className="text-gray-900 capitalize">{order.property_type}</p>
            </div>
            {order.estimated_closing_date && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Est. Closing Date</h3>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">
                    {new Date(order.estimated_closing_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            {order.sale_amount && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Sale Amount</h3>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    }).format(order.sale_amount)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submitted Date */}
          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-gray-500">
              Submitted on {new Date(order.created_at).toLocaleDateString()} at{' '}
              {new Date(order.created_at).toLocaleTimeString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Links */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <Link
          href="/customer"
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go to Dashboard
        </Link>
        <Link
          href="/search"
          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-brand-blue-light transition-colors"
        >
          Schedule Another Closing
        </Link>
      </div>
    </div>
  )
}

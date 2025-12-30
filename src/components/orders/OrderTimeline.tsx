'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Clock,
  FileText,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
} from 'lucide-react'

interface TimelineEvent {
  id: string
  type: 'created' | 'status_change' | 'attorney_assigned' | 'note_added' | 'completed'
  title: string
  description: string
  timestamp: string
  icon: React.ReactNode
  color: string
}

interface OrderNote {
  id: string
  note: string
  is_internal: boolean
  created_at: string
  author: { full_name: string } | null
}

interface OrderTimelineProps {
  orderId: string
  orderCreatedAt: string
  orderStatus: string
  orderCompletedAt: string | null
  assignedAttorney?: { profiles: { full_name: string } | null } | null
}

export function OrderTimeline({
  orderId,
  orderCreatedAt,
  orderStatus,
  orderCompletedAt,
  assignedAttorney,
}: OrderTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buildTimeline()
  }, [orderId, orderStatus, orderCompletedAt, assignedAttorney])

  async function buildTimeline() {
    const supabase = createClient()
    const timelineEvents: TimelineEvent[] = []

    // 1. Order Created
    timelineEvents.push({
      id: 'created',
      type: 'created',
      title: 'Order Created',
      description: 'Order was submitted to the system',
      timestamp: orderCreatedAt,
      icon: <FileText size={16} />,
      color: 'bg-blue-500',
    })

    // 2. Fetch order notes for timeline
    const { data: notes } = await supabase
      .from('order_notes')
      .select('id, note, is_internal, created_at, author:profiles!author_id(full_name)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (notes) {
      (notes as OrderNote[]).forEach((note) => {
        timelineEvents.push({
          id: `note-${note.id}`,
          type: 'note_added',
          title: note.is_internal ? 'Internal Note Added' : 'Note Added',
          description: `${note.author?.full_name || 'Unknown'}: "${note.note.substring(0, 100)}${note.note.length > 100 ? '...' : ''}"`,
          timestamp: note.created_at,
          icon: <AlertCircle size={16} />,
          color: note.is_internal ? 'bg-yellow-500' : 'bg-gray-500',
        })
      })
    }

    // 3. Attorney Assigned (if assigned)
    if (assignedAttorney?.profiles) {
      // We don't have exact assignment time, so we'll estimate it
      timelineEvents.push({
        id: 'attorney-assigned',
        type: 'attorney_assigned',
        title: 'Attorney Assigned',
        description: `${assignedAttorney.profiles.full_name} was assigned to handle this order`,
        timestamp: orderCreatedAt, // We don't track when assignment happened
        icon: <UserCheck size={16} />,
        color: 'bg-purple-500',
      })
    }

    // 4. Status changes (inferred from current status)
    if (orderStatus === 'in_progress') {
      timelineEvents.push({
        id: 'in-progress',
        type: 'status_change',
        title: 'Work Started',
        description: 'Order status changed to In Progress',
        timestamp: orderCreatedAt, // We don't track exact status change times
        icon: <Play size={16} />,
        color: 'bg-blue-500',
      })
    }

    if (orderStatus === 'completed' && orderCompletedAt) {
      timelineEvents.push({
        id: 'completed',
        type: 'completed',
        title: 'Order Completed',
        description: 'All closing tasks have been finalized',
        timestamp: orderCompletedAt,
        icon: <CheckCircle size={16} />,
        color: 'bg-green-500',
      })
    }

    if (orderStatus === 'cancelled') {
      timelineEvents.push({
        id: 'cancelled',
        type: 'status_change',
        title: 'Order Cancelled',
        description: 'This order was cancelled',
        timestamp: orderCreatedAt, // We don't track cancellation time
        icon: <XCircle size={16} />,
        color: 'bg-red-500',
      })
    }

    // Sort by timestamp
    timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    setEvents(timelineEvents)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={20} />
          Order Timeline
        </h3>
        <p className="text-gray-500 text-sm">Loading timeline...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock size={20} />
        Order Timeline
      </h3>

      {events.length === 0 ? (
        <p className="text-gray-500">No timeline events</p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={event.id} className="relative flex gap-4">
                {/* Icon circle */}
                <div
                  className={`relative z-10 w-8 h-8 rounded-full ${event.color} flex items-center justify-center text-white shrink-0`}
                >
                  {event.icon}
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <span className="text-xs text-gray-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  FileText,
  Calendar,
  Users,
  MapPin,
  SlidersHorizontal,
  Mail,
  MessageSquare,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'

interface LawFirmOrder {
  id: string
  order_number: string
  status: string
  property_street: string
  property_city: string
  property_state: string
  property_zip: string
  closing_type: string
  estimated_closing_date: string | null
  created_at: string
  assigned_attorney_id: string | null
  attorneys: {
    profiles: { full_name: string } | null
  } | null
  // Task count from order_tasks table
  pending_task_count?: number
}

interface Attorney {
  id: string
  is_active: boolean
  profiles: {
    id: string
    full_name: string
    email: string
  } | null
}

type FilterTab = 'all' | 'active' | 'on_hold' | 'withdrawn'

// Map internal status to display
function getDisplayStatus(status: string): string {
  switch (status) {
    case 'new':
    case 'in_progress':
      return 'Active'
    case 'cancelled':
      return 'Withdrawn'
    case 'completed':
      return 'Completed'
    default:
      return 'On Hold'
  }
}

function getStatusColor(displayStatus: string): string {
  switch (displayStatus) {
    case 'Active':
      return 'bg-green-100 text-green-700 border border-green-200'
    case 'On Hold':
      return 'bg-orange-100 text-orange-700 border border-orange-200'
    case 'Withdrawn':
      return 'bg-gray-100 text-gray-500 border border-gray-200'
    case 'Completed':
      return 'bg-blue-100 text-blue-700 border border-blue-200'
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200'
  }
}

function getDaysUntilClosing(closingDate: string | null): number | null {
  if (!closingDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const closing = new Date(closingDate)
  closing.setHours(0, 0, 0, 0)
  const diffTime = closing.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getClosingTypeLabel(type: string): string {
  switch (type) {
    case 'purchase':
      return 'Purchase / Sale'
    case 'refinance':
      return 'Refinance'
    case 'heloc':
      return 'HELOC'
    default:
      return type.charAt(0).toUpperCase() + type.slice(1)
  }
}

// Event Calendar Component
function EventCalendar({ closingDates }: { closingDates: Date[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const startingDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa']

  const hasClosing = (day: number): boolean => {
    return closingDates.some(date =>
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    )
  }

  const isToday = (day: number): boolean => {
    const today = new Date()
    return today.getFullYear() === year &&
           today.getMonth() === month &&
           today.getDate() === day
  }

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Event Calendar</h3>
        <button className="p-1 text-gray-400 hover:text-gray-600">
          <SlidersHorizontal size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="p-1 hover:bg-gray-100 rounded text-gray-500"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-gray-700">
          {monthNames[month]} {year}
        </span>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="p-1 hover:bg-gray-100 rounded text-gray-500"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map(day => (
          <div key={day} className="text-xs font-medium text-gray-400 py-1">
            {day}
          </div>
        ))}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`text-xs py-1.5 rounded-full w-7 h-7 flex items-center justify-center mx-auto ${
              day === null
                ? ''
                : isToday(day)
                  ? 'bg-blue-600 text-white font-semibold'
                  : hasClosing(day)
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  )
}

// Upcoming Closing Card
function UpcomingClosingCard({ order }: { order: LawFirmOrder }) {
  const closingDate = new Date(order.estimated_closing_date!)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <Link href={`/transaction/${order.id}`} className="block p-3 border rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="text-blue-600 mt-0.5">
          <Calendar size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm">
            {monthNames[closingDate.getMonth()]} {closingDate.getDate()} Closing
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {dayNames[closingDate.getDay()]} - {monthNames[closingDate.getMonth()]} {closingDate.getDate()}, {closingDate.getFullYear()} - 1:00 am
          </p>
          <p className="text-xs text-gray-500">
            {getClosingTypeLabel(order.closing_type)}
          </p>
          <p className="text-xs text-gray-600 mt-1 truncate">
            {order.property_street}, {order.property_city}, {order.property_state} {order.property_zip}
          </p>

          {/* Participant avatars */}
          <div className="flex items-center gap-1 mt-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
              {order.attorneys?.profiles?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <Mail size={12} className="text-gray-500" />
            </div>
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <MessageSquare size={12} className="text-gray-500" />
            </div>
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
              +2
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function LawFirmView() {
  const { user } = useAuth()
  const [lawFirmId, setLawFirmId] = useState<string | null>(null)
  const [lawFirmName, setLawFirmName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<LawFirmOrder[]>([])
  const [attorneys, setAttorneys] = useState<Attorney[]>([])
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  useEffect(() => {
    if (!user) return
    fetchLawFirmData()
  }, [user])

  async function fetchLawFirmData() {
    const supabase = createClient()

    // Get law firm
    const { data: firmData } = await supabase
      .from('law_firms')
      .select('id, name')
      .eq('owner_id', user!.id)
      .single()

    if (!firmData) {
      setLoading(false)
      return
    }

    setLawFirmId(firmData.id)
    setLawFirmName(firmData.name)

    // Get orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        property_street,
        property_city,
        property_state,
        property_zip,
        closing_type,
        estimated_closing_date,
        created_at,
        assigned_attorney_id,
        attorneys:assigned_attorney_id (
          profiles (full_name)
        )
      `)
      .eq('law_firm_id', firmData.id)
      .order('created_at', { ascending: false })

    if (ordersData) {
      // Fetch pending task counts for each order
      const orderIds = ordersData.map((o: { id: string }) => o.id)
      const { data: taskCounts } = await supabase
        .from('order_tasks')
        .select('order_id')
        .in('order_id', orderIds)
        .eq('status', 'pending')

      // Count tasks per order
      const taskCountMap = new Map<string, number>()
      taskCounts?.forEach((task: { order_id: string }) => {
        const count = taskCountMap.get(task.order_id) || 0
        taskCountMap.set(task.order_id, count + 1)
      })

      // Add task counts to orders
      const ordersWithTasks = ordersData.map((order: { id: string }) => ({
        ...order,
        pending_task_count: taskCountMap.get(order.id) || 0,
      }))

      setOrders(ordersWithTasks as LawFirmOrder[])
    }

    // Get attorneys
    const { data: attorneysData } = await supabase
      .from('attorneys')
      .select(`
        id,
        is_active,
        profiles (id, full_name, email)
      `)
      .eq('law_firm_id', firmData.id)

    if (attorneysData) {
      setAttorneys(attorneysData as Attorney[])
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!lawFirmId) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center">
        <p className="text-gray-600 mb-4">You don&apos;t have any active closings yet. Click below to create your first one!</p>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Schedule a closing
        </Link>
      </div>
    )
  }

  // Calculate stats
  const stats = {
    total: orders.length,
    active: orders.filter(o => o.status === 'new' || o.status === 'in_progress').length,
    onHold: orders.filter(o => o.status !== 'new' && o.status !== 'in_progress' && o.status !== 'cancelled' && o.status !== 'completed').length,
    withdrawn: orders.filter(o => o.status === 'cancelled').length,
  }

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const displayStatus = getDisplayStatus(order.status)
    switch (activeTab) {
      case 'active':
        return displayStatus === 'Active'
      case 'on_hold':
        return displayStatus === 'On Hold'
      case 'withdrawn':
        return displayStatus === 'Withdrawn'
      default:
        return true
    }
  })

  // Get closing dates for calendar
  const closingDates = orders
    .filter(o => o.estimated_closing_date && o.status !== 'cancelled' && o.status !== 'completed')
    .map(o => new Date(o.estimated_closing_date!))

  // Get upcoming closings
  const upcomingClosings = orders
    .filter(o => {
      if (!o.estimated_closing_date) return false
      if (o.status === 'cancelled' || o.status === 'completed') return false
      const days = getDaysUntilClosing(o.estimated_closing_date)
      return days !== null && days >= 0
    })
    .sort((a, b) => new Date(a.estimated_closing_date!).getTime() - new Date(b.estimated_closing_date!).getTime())
    .slice(0, 3)

  const tabs = [
    { id: 'all' as FilterTab, label: 'All Closing Orders', count: stats.total },
    { id: 'active' as FilterTab, label: 'Active', count: stats.active },
    { id: 'on_hold' as FilterTab, label: 'On Hold', count: stats.onHold },
    { id: 'withdrawn' as FilterTab, label: 'Withdrawn', count: stats.withdrawn },
  ]

  // Filter pills for top bar
  const filterPills = [
    { label: 'All Closing Orders', count: stats.total, active: true },
    { label: 'Title Orders All', count: stats.total, active: false },
    { label: 'Closing Calendars', count: null, active: false },
    { label: 'Closing Agents', count: null, active: false },
    { label: 'Locations', count: null, active: false },
  ]

  return (
    <div className="space-y-4">
      {/* Filter Pills Header */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterPills.map((pill, index) => (
          <button
            key={index}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              pill.active
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {pill.label}
            {pill.count !== null && (
              <span className={`text-xs ${pill.active ? 'text-blue-600' : 'text-gray-500'}`}>
                ({pill.count})
              </span>
            )}
            <ChevronDown size={14} />
          </button>
        ))}
        <button className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700">
          <ChevronDown size={16} />
        </button>
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Orders List */}
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-lg border p-8 text-center">
                <p className="text-gray-500 mb-4">No orders found</p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus size={18} />
                  Schedule New Closing
                </Link>
              </div>
            ) : (
              filteredOrders.slice(0, 10).map((order) => {
                const displayStatus = getDisplayStatus(order.status)
                const statusColor = getStatusColor(displayStatus)
                const daysUntil = getDaysUntilClosing(order.estimated_closing_date)
                const fullAddress = `${order.property_street}, ${order.property_city}, ${order.property_state} ${order.property_zip}`

                return (
                  <div key={order.id} className="bg-white rounded-lg border p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/transaction/${order.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm block truncate"
                        >
                          {fullAddress}
                        </Link>

                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <span className="font-medium text-gray-700">T</span>
                          </span>
                          {order.pending_task_count !== undefined && order.pending_task_count > 0 ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                              {order.pending_task_count} Pending Task{order.pending_task_count !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-gray-400">
                              <span className="w-2 h-2 rounded-full bg-green-500"></span>
                              No Pending Tasks
                            </span>
                          )}
                          {daysUntil !== null && displayStatus === 'Active' && (
                            <span className="flex items-center gap-1.5">
                              <Clock size={12} className="text-gray-400" />
                              Closing in {daysUntil} days
                            </span>
                          )}
                        </div>
                      </div>

                      <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                        {displayStatus}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block w-72 space-y-4">
          {/* Calendar Widget */}
          <EventCalendar closingDates={closingDates} />

          {/* Upcoming Closings */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Upcoming</h3>

            {upcomingClosings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No upcoming closings
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingClosings.map((order) => (
                  <UpcomingClosingCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Sections - Contacts and Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Contacts */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Contacts</h3>
          </div>
          <div className="p-4 space-y-3">
            {attorneys.slice(0, 5).map((attorney) => (
              <div key={attorney.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium">
                    {attorney.profiles?.full_name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{attorney.profiles?.full_name}</p>
                    <p className="text-xs text-gray-500">Attorney</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                    <MessageSquare size={16} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                    <Mail size={16} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 pt-2">
              <button className="text-sm text-blue-600 hover:underline">+ New Contact</button>
              <button className="text-sm text-gray-500 hover:underline">View All Contacts</button>
            </div>
          </div>
        </div>

        {/* Firm Staff */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Firm Staff</h3>
          </div>
          <div className="p-4 space-y-3">
            {attorneys.slice(0, 5).map((attorney) => (
              <div key={attorney.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium">
                    {attorney.profiles?.full_name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{attorney.profiles?.full_name}</p>
                    <p className="text-xs text-gray-500">Attorney / Paralegal</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                    <MessageSquare size={16} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                    <Mail size={16} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 pt-2">
              <Link href="/dashboard/attorneys" className="text-sm text-blue-600 hover:underline">Add Staff +</Link>
              <Link href="/dashboard/attorneys" className="text-sm text-gray-500 hover:underline">View All Staff</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

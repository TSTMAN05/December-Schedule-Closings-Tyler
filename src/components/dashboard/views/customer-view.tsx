'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  SlidersHorizontal,
  Plus,
} from 'lucide-react'

interface OrderStats {
  total: number
  active: number
  onHold: number
  withdrawn: number
}

interface CustomerOrder {
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
  law_firms: { name: string } | null
}

type FilterTab = 'all' | 'active' | 'on_hold' | 'withdrawn'

// Map internal status to display status
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

// Get status badge colors based on display status
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

// Calculate days until closing
function getDaysUntilClosing(closingDate: string | null): number | null {
  if (!closingDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const closing = new Date(closingDate)
  closing.setHours(0, 0, 0, 0)
  const diffTime = closing.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Format closing type for display
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

// Mini Calendar Component
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

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  // Check if a date has a closing
  const hasClosing = (day: number): boolean => {
    return closingDates.some(date =>
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    )
  }

  // Check if date is today
  const isToday = (day: number): boolean => {
    const today = new Date()
    return today.getFullYear() === year &&
           today.getMonth() === month &&
           today.getDate() === day
  }

  // Generate calendar days
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
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          Event Calendar
        </h3>
        <button className="p-1 text-gray-400 hover:text-gray-600">
          <SlidersHorizontal size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1 hover:bg-gray-100 rounded text-gray-500"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-gray-700">
          {monthNames[month]} {year}
        </span>
        <button
          onClick={nextMonth}
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
function UpcomingClosingCard({ order }: { order: CustomerOrder }) {
  const closingDate = new Date(order.estimated_closing_date!)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const formattedDate = `${dayNames[closingDate.getDay()]}, ${monthNames[closingDate.getMonth()]} ${closingDate.getDate()}, ${closingDate.getFullYear()}`

  return (
    <Link href={`/transaction/${order.id}`} className="block p-3 border rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="text-blue-600 mt-0.5">
          <Calendar size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm">
            {closingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Closing
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {formattedDate} - 1:00 am
          </p>
          <p className="text-xs text-gray-500">
            {getClosingTypeLabel(order.closing_type)}
          </p>
          <p className="text-xs text-gray-600 mt-1 truncate">
            {order.property_street}, {order.property_city}, {order.property_state} {order.property_zip}
          </p>

          {/* Participant avatars placeholder */}
          <div className="flex items-center gap-1 mt-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
              C
            </div>
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-medium">
              A
            </div>
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-medium">
              L
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function CustomerView() {
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    active: 0,
    onHold: 0,
    withdrawn: 0,
  })
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  useEffect(() => {
    if (!user) return

    const userId = user.id

    async function fetchDashboardData() {
      const supabase = createClient()

      const { data: ordersData, error } = await supabase
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
          law_firms (name)
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        setLoading(false)
        return
      }

      if (ordersData) {
        // Calculate stats based on display status
        const active = ordersData.filter((o: { status: string }) =>
          o.status === 'new' || o.status === 'in_progress'
        ).length
        const onHold = ordersData.filter((o: { status: string }) =>
          o.status !== 'new' &&
          o.status !== 'in_progress' &&
          o.status !== 'cancelled' &&
          o.status !== 'completed'
        ).length
        const withdrawn = ordersData.filter((o: { status: string }) => o.status === 'cancelled').length

        setStats({
          total: ordersData.length,
          active,
          onHold,
          withdrawn,
        })
        setOrders(ordersData as CustomerOrder[])
      }

      setLoading(false)
    }

    fetchDashboardData()

    const supabase = createClient()
    const subscription = supabase
      .channel('customer-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${userId}`,
        },
        () => {
          fetchDashboardData()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  // Filter orders based on active tab
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

  // Get upcoming closings (non-completed, non-cancelled, with closing date in future)
  const upcomingClosings = orders
    .filter(o => {
      if (!o.estimated_closing_date) return false
      if (o.status === 'cancelled' || o.status === 'completed') return false
      const days = getDaysUntilClosing(o.estimated_closing_date)
      return days !== null && days >= 0
    })
    .sort((a, b) => {
      const dateA = new Date(a.estimated_closing_date!).getTime()
      const dateB = new Date(b.estimated_closing_date!).getTime()
      return dateA - dateB
    })
    .slice(0, 3)

  const tabs = [
    { id: 'all' as FilterTab, label: 'All Orders', count: stats.total },
    { id: 'active' as FilterTab, label: 'Active', count: stats.active },
    { id: 'on_hold' as FilterTab, label: 'On Hold', count: stats.onHold },
    { id: 'withdrawn' as FilterTab, label: 'Withdrawn', count: stats.withdrawn },
  ]

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Tabs Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <SlidersHorizontal size={18} />
          </button>
        </div>

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
            filteredOrders.map((order) => {
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
                        {/* Pending Tasks indicator */}
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          Pending Tasks
                        </span>

                        {/* Closing countdown */}
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
  )
}

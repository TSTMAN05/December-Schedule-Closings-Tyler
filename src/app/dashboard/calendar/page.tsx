'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

interface CalendarOrder {
  id: string
  order_number: string
  property_street: string
  property_city: string
  closing_type: string
  estimated_closing_date: string
  status: string
}

export default function DashboardCalendarPage() {
  const { user, profile, isLoading: authLoading } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [orders, setOrders] = useState<CalendarOrder[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = profile?.role === 'admin'

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

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  useEffect(() => {
    if (!user) return
    fetchOrders()
  }, [user, profile])

  async function fetchOrders() {
    const supabase = createClient()

    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        property_street,
        property_city,
        closing_type,
        estimated_closing_date,
        status
      `)
      .not('estimated_closing_date', 'is', null)
      .not('status', 'eq', 'cancelled')
      .not('status', 'eq', 'completed')

    // Filter by customer if not admin
    if (!isAdmin && user) {
      query = query.eq('customer_id', user.id)
    }

    const { data, error } = await query

    if (!error && data) {
      setOrders(data as CalendarOrder[])
    }
    setLoading(false)
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  // Generate calendar days
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Check if date is today
  const isToday = (day: number): boolean => {
    const today = new Date()
    return today.getFullYear() === year &&
           today.getMonth() === month &&
           today.getDate() === day
  }

  // Get orders for a specific day
  const getOrdersForDay = (day: number): CalendarOrder[] => {
    return orders.filter(order => {
      const closingDate = new Date(order.estimated_closing_date)
      return closingDate.getFullYear() === year &&
             closingDate.getMonth() === month &&
             closingDate.getDate() === day
    })
  }

  // Group days into weeks
  const weeks: (number | null)[][] = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={18} />
          Add Event
        </Link>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg border">
        {/* Month Navigation */}
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b">
          {dayNames.map(day => (
            <div key={day} className="px-4 py-3 text-center text-sm font-medium text-gray-500 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="divide-y">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7">
              {week.map((day, dayIndex) => {
                const dayOrders = day ? getOrdersForDay(day) : []
                return (
                  <div
                    key={dayIndex}
                    className={`min-h-[120px] p-2 border-r last:border-r-0 ${
                      day === null ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {day !== null && (
                      <>
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                            isToday(day)
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'text-gray-700'
                          }`}
                        >
                          {day}
                        </span>
                        {/* Events for this day */}
                        <div className="mt-1 space-y-1">
                          {dayOrders.slice(0, 2).map(order => (
                            <Link
                              key={order.id}
                              href={`/transaction/${order.id}`}
                              className="block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded truncate hover:bg-blue-200"
                            >
                              {order.property_street}
                            </Link>
                          ))}
                          {dayOrders.length > 2 && (
                            <span className="block px-2 py-1 text-xs text-gray-500">
                              +{dayOrders.length - 2} more
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

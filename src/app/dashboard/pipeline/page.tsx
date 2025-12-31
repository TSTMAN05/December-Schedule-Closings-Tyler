'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/providers/AuthProvider'
import { Spinner } from '@/components/ui'
import { SERVICE_PROVIDER_TYPES } from '@/components/dashboard/views'
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Calendar,
  ChevronDown,
  Users,
  MapPin,
  Download,
  Columns,
  ArrowLeft,
} from 'lucide-react'

interface PipelineOrder {
  id: string
  order_number: string
  status: string
  property_street: string
  property_city: string
  property_state: string
  property_zip: string
  property_type: string
  closing_type: string
  customer_role: string
  customer_name: string
  estimated_closing_date: string | null
  created_at: string
  law_firm_id: string
  assigned_attorney_id: string | null
  // New order fields
  order_type: 'closing' | 'notary' | 'title' | null
  title_status: 'unassigned' | 'no_title_needed' | 'in_process' | 'waiting_for_review' | 'complete' | null
  seller_name: string | null
  buyer_name: string | null
  needs_date: boolean | null
  needs_time: boolean | null
  needs_location: boolean | null
  closing_calendar_id: string | null
  // Nested relations
  law_firms: { id: string; name: string } | null
  attorneys: { profiles: { full_name: string } | null } | null
  closing_calendar: { id: string; name: string; color: string } | null
}

type ViewMode = 'closings' | 'title_orders'
type TabFilter = 'all' | 'new_existing' | 'closed_final' | 'cancelled'

// Map internal status to display
function getDisplayStatus(status: string): { label: string; color: string } {
  switch (status) {
    case 'new':
      return { label: 'In Progress', color: 'bg-blue-100 text-blue-700' }
    case 'in_progress':
      return { label: 'In Progress', color: 'bg-blue-100 text-blue-700' }
    case 'completed':
      return { label: 'Closed', color: 'bg-green-100 text-green-700' }
    case 'cancelled':
      return { label: 'Withdrawn', color: 'bg-gray-100 text-gray-500' }
    default:
      return { label: 'On-Hold', color: 'bg-orange-100 text-orange-700' }
  }
}

function getTitleStatusDisplay(titleStatus: string | null): { label: string; color: string } {
  switch (titleStatus) {
    case 'unassigned':
      return { label: 'New Order Unassigned', color: 'bg-red-100 text-red-700' }
    case 'no_title_needed':
      return { label: 'No Title Needed', color: 'bg-gray-100 text-gray-600' }
    case 'in_process':
      return { label: 'In Process', color: 'bg-yellow-100 text-yellow-700' }
    case 'waiting_for_review':
      return { label: 'Waiting For Review', color: 'bg-blue-100 text-blue-700' }
    case 'complete':
      return { label: 'Complete', color: 'bg-green-100 text-green-700' }
    default:
      return { label: 'Unassigned', color: 'bg-red-100 text-red-700' }
  }
}

// Format closing type
function getClosingTypeLabel(type: string): string {
  switch (type) {
    case 'purchase':
      return 'Purchase / Sale'
    case 'refinance':
      return 'Refinance'
    case 'heloc':
      return 'HELOC'
    case 'lease_option':
      return 'Lease Option'
    default:
      return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
  }
}

export default function DashboardPipelinePage() {
  const { user, profile, isLoading: authLoading } = useAuth()
  const [orders, setOrders] = useState<PipelineOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>('closings')
  const [tabFilter, setTabFilter] = useState<TabFilter>('all')
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [attorneys, setAttorneys] = useState<{ id: string; name: string; assignments: number }[]>([])

  const isAdmin = profile?.role === 'admin'
  const roleName = profile?.profile_type || profile?.role || 'customer'
  const isServiceProvider = SERVICE_PROVIDER_TYPES.includes(roleName as typeof SERVICE_PROVIDER_TYPES[number])

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
        status,
        property_street,
        property_city,
        property_state,
        property_zip,
        property_type,
        closing_type,
        customer_role,
        customer_name,
        estimated_closing_date,
        created_at,
        law_firm_id,
        assigned_attorney_id,
        order_type,
        title_status,
        seller_name,
        buyer_name,
        needs_date,
        needs_time,
        needs_location,
        closing_calendar_id,
        law_firms (id, name),
        attorneys:assigned_attorney_id (
          profiles (full_name)
        ),
        closing_calendar:closing_calendars (id, name, color)
      `)
      .order('created_at', { ascending: false })

    // Filter based on role
    let lawFirmId: string | null = null
    if (isServiceProvider && user) {
      // Get law firm for this user
      const { data: firmData } = await supabase
        .from('law_firms')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (firmData) {
        lawFirmId = firmData.id
        query = query.eq('law_firm_id', firmData.id)
      }
    } else if (!isAdmin && user) {
      query = query.eq('customer_id', user.id)
    }

    const { data, error } = await query

    if (!error && data) {
      setOrders(data as PipelineOrder[])
    }

    // Fetch attorneys for the closing agents dropdown
    if (lawFirmId) {
      const { data: attorneyData } = await supabase
        .from('attorneys')
        .select(`
          id,
          current_assignments,
          profiles (full_name)
        `)
        .eq('law_firm_id', lawFirmId)
        .eq('is_active', true)

      if (attorneyData) {
        setAttorneys(attorneyData.map((a: { id: string; current_assignments: number | null; profiles: { full_name: string } | null }) => ({
          id: a.id,
          name: a.profiles?.full_name || 'Unknown',
          assignments: a.current_assignments || 0,
        })))
      }
    }

    setLoading(false)
  }

  // Filter orders based on tab
  const getFilteredByTab = (orders: PipelineOrder[]) => {
    switch (tabFilter) {
      case 'new_existing':
        return orders.filter(o => o.status === 'new' || o.status === 'in_progress')
      case 'closed_final':
        return orders.filter(o => o.status === 'completed')
      case 'cancelled':
        return orders.filter(o => o.status === 'cancelled')
      default:
        return orders
    }
  }

  // Filter orders by search
  const filteredOrders = getFilteredByTab(orders).filter(order => {
    const searchMatch = searchTerm === '' ||
      order.property_street.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.property_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    return searchMatch
  })

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Toggle selection
  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const toggleAllSelection = () => {
    if (selectedOrders.size === paginatedOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(paginatedOrders.map(o => o.id)))
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  // Stats counts using live data from new order fields
  const stats = {
    all: orders.length,
    closing: orders.filter(o => o.order_type === 'closing' || !o.order_type).length,
    notary: orders.filter(o => o.order_type === 'notary').length,
    dateNeeded: orders.filter(o => o.needs_date === true).length,
    locationNeeded: orders.filter(o => o.needs_location === true).length,
    timeNeeded: orders.filter(o => o.needs_time === true).length,
    // Title Orders stats from title_status field
    unassigned: orders.filter(o => o.title_status === 'unassigned' || !o.title_status).length,
    noTitleNeeded: orders.filter(o => o.title_status === 'no_title_needed').length,
    inProcess: orders.filter(o => o.title_status === 'in_process').length,
    waitingForReview: orders.filter(o => o.title_status === 'waiting_for_review').length,
    titleComplete: orders.filter(o => o.title_status === 'complete').length,
    // Closing Calendars stats
    newToAccept: orders.filter(o => o.status === 'new').length,
    pending: orders.filter(o => o.status !== 'new' && o.status !== 'in_progress' && o.status !== 'completed' && o.status !== 'cancelled').length,
    readyToClose: orders.filter(o => o.status === 'in_progress' && o.estimated_closing_date && new Date(o.estimated_closing_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length,
    closedLast30: orders.filter(o => {
      if (o.status !== 'completed') return false
      // Check if completed_at is within last 30 days (using created_at as fallback)
      const orderDate = new Date(o.created_at)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return orderDate >= thirtyDaysAgo
    }).length,
    // Closing Agents - will be populated from attorneys
    agents: [] as { name: string; count: number }[],
  }

  // Tab stats for title orders view
  const tabStats = {
    all: orders.length,
    new_existing: orders.filter(o => o.status === 'new' || o.status === 'in_progress').length,
    closed_final: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  return (
    <div className="space-y-4">
      {/* Title Orders View */}
      {viewMode === 'title_orders' && (
        <>
          {/* Breadcrumb Header */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('closings')}
              className="p-1 hover:bg-gray-100 rounded text-gray-500"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Pipeline / Title Orders</h1>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b">
            {[
              { id: 'all' as TabFilter, label: 'All Titles' },
              { id: 'new_existing' as TabFilter, label: 'New / Existing Orders' },
              { id: 'closed_final' as TabFilter, label: 'Closed / Final Orders' },
              { id: 'cancelled' as TabFilter, label: 'Canceled / Withdrawn' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTabFilter(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tabFilter === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border-2 ${tabFilter === 'all' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
              <p className="text-sm text-gray-600">All Orders</p>
              <p className="text-2xl font-bold text-gray-900">{tabStats.all}</p>
            </div>
            <div className={`p-4 rounded-lg border-2 ${tabFilter === 'new_existing' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
              <p className="text-sm text-gray-600">New / Existing</p>
              <p className="text-2xl font-bold text-gray-900">{tabStats.new_existing}</p>
            </div>
            <div className={`p-4 rounded-lg border-2 ${tabFilter === 'closed_final' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
              <p className="text-sm text-gray-600">Closed / Final</p>
              <p className="text-2xl font-bold text-gray-900">{tabStats.closed_final}</p>
            </div>
            <div className={`p-4 rounded-lg border-2 ${tabFilter === 'cancelled' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
              <p className="text-sm text-gray-600">Canceled / Withdrawn</p>
              <p className="text-2xl font-bold text-gray-900">{tabStats.cancelled}</p>
            </div>
          </div>
        </>
      )}

      {/* Closings View - Header Stats with Dropdowns */}
      {viewMode === 'closings' && (
        <div className="flex items-start gap-4 flex-wrap">
          {/* All Closing Orders Dropdown */}
          <div className="bg-white rounded-lg border p-4 min-w-[200px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <h3 className="font-semibold text-blue-600 text-sm">All Closing Orders</h3>
              <span className="ml-auto text-sm font-medium text-gray-600">{stats.all}</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer">
                <span>Closing</span>
                <span>{stats.closing}</span>
              </div>
              <div className="flex justify-between text-gray-600 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer">
                <span>Notary</span>
                <span>{stats.notary}</span>
              </div>
              <div className="flex justify-between text-gray-600 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer">
                <span>Date Needed</span>
                <span>{stats.dateNeeded}</span>
              </div>
              <div className="flex justify-between text-gray-600 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer">
                <span>Location Needed</span>
                <span>{stats.locationNeeded}</span>
              </div>
              <div className="flex justify-between text-gray-600 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer">
                <span>Time Needed</span>
                <span>{stats.timeNeeded}</span>
              </div>
            </div>
          </div>

          {/* Title Orders All Dropdown */}
          <div className="bg-white rounded-lg border p-4 min-w-[200px]">
            <button
              onClick={() => setViewMode('title_orders')}
              className="flex items-center gap-2 mb-3 w-full text-left"
            >
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <h3 className="font-semibold text-gray-700 text-sm hover:text-blue-600">Title Orders All</h3>
              <span className="ml-auto text-sm font-medium text-gray-600">{stats.all}</span>
            </button>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer">
                <span>Unassigned</span>
                <span>{stats.unassigned}</span>
              </div>
              <div className="flex justify-between text-gray-600 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer">
                <span>No Title Needed</span>
                <span>{stats.noTitleNeeded}</span>
              </div>
              <div className="flex justify-between text-gray-600 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer">
                <span>In Process</span>
                <span>{stats.inProcess}</span>
              </div>
              <div className="flex justify-between text-gray-600 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer">
                <span>Waiting For Review</span>
                <span>{stats.waitingForReview}</span>
              </div>
            </div>
          </div>

          {/* Closing Calendars Dropdown */}
          <div className="bg-white rounded-lg border p-4 min-w-[200px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <h3 className="font-semibold text-gray-700 text-sm">Closing Calendars</h3>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer">
                <span>New Orders to Accept</span>
                <span>{stats.newToAccept}</span>
              </div>
              <div className="flex justify-between text-gray-600 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer">
                <span>Pending</span>
                <span>{stats.pending}</span>
              </div>
              <div className="flex justify-between text-gray-600 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer">
                <span>In Progress</span>
                <span>{stats.inProcess}</span>
              </div>
              <div className="flex justify-between text-gray-600 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer">
                <span>Ready to Close</span>
                <span>{stats.readyToClose}</span>
              </div>
              <div className="flex justify-between text-gray-600 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer">
                <span>Closed Last 30 Days</span>
                <span>{stats.closedLast30}</span>
              </div>
            </div>
          </div>

          {/* Closing Agents Dropdown */}
          <div className="bg-white rounded-lg border p-4 min-w-[200px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <h3 className="font-semibold text-gray-700 text-sm">Closing Agents</h3>
              <span className="text-xs text-blue-600">- Assigned, Available</span>
            </div>
            <div className="space-y-1.5 text-sm">
              {attorneys.length > 0 ? (
                attorneys.map((agent) => (
                  <div key={agent.id} className="flex justify-between text-gray-600 hover:bg-gray-50 px-1 py-0.5 rounded cursor-pointer">
                    <span>{agent.name}</span>
                    <span>{agent.assignments}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-xs">No agents found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <button className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border">
              <Filter size={16} />
              Filter by Roles
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border">
              <Columns size={16} />
              Edit Columns
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg border">
              <Download size={16} />
              Export
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Start</span>
              <span className="text-gray-400">-</span>
              <span className="text-sm text-gray-500">End</span>
              <Calendar size={16} className="text-gray-400" />
            </div>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === paginatedOrders.length && paginatedOrders.length > 0}
                    onChange={toggleAllSelection}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  T
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Actions
                    <ChevronDown size={14} />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Transaction Type
                    <ChevronDown size={14} />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Closing Date
                    <ChevronDown size={14} />
                  </div>
                </th>
                {viewMode === 'title_orders' && (
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Title Status
                      <ChevronDown size={14} />
                    </div>
                  </th>
                )}
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Closing Status
                    <ChevronDown size={14} />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Law Firm Name
                    <ChevronDown size={14} />
                  </div>
                </th>
                {viewMode === 'closings' && (
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Seller Name(s)
                      <ChevronDown size={14} />
                    </div>
                  </th>
                )}
                {viewMode === 'title_orders' && (
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Closing Calendar
                      <ChevronDown size={14} />
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={viewMode === 'title_orders' ? 9 : 8} className="px-4 py-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const status = getDisplayStatus(order.status)
                  const titleStatus = getTitleStatusDisplay(order.title_status)
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => toggleOrderSelection(order.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded text-xs font-medium text-gray-600">
                          T
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <Link
                            href={`/transaction/${order.id}`}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="View"
                          >
                            <Eye size={16} />
                          </Link>
                          <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded" title="More">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {getClosingTypeLabel(order.closing_type)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.estimated_closing_date
                          ? new Date(order.estimated_closing_date).toLocaleDateString('en-US', {
                              month: '2-digit',
                              day: '2-digit',
                              year: 'numeric'
                            })
                          : '-'}
                      </td>
                      {viewMode === 'title_orders' && (
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${titleStatus.color}`}>
                            {titleStatus.label}
                          </span>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.law_firms?.name || '-'}
                      </td>
                      {viewMode === 'closings' && (
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {order.seller_name || order.customer_name || '-'}
                        </td>
                      )}
                      {viewMode === 'title_orders' && (
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {order.closing_calendar?.name || (order.law_firms?.name ? `${order.law_firms.name.split(' ')[0]} Closing` : '-')}
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredOrders.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              const page = currentPage <= 2 ? i + 1 : currentPage - 1 + i
              if (page > totalPages) return null
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded text-sm font-medium ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              )
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

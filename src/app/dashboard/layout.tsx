'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui'
import { getProfileTypeLabel } from '@/lib/utils/profileTypes'
import {
  LayoutDashboard,
  FileText,
  Users,
  Building,
  Calendar,
  Settings,
  ClipboardList,
  DollarSign,
  ChevronLeft,
  Link2,
  GitBranch,
  BarChart3,
  Shield,
  ExternalLink,
} from 'lucide-react'
import { SERVICE_PROVIDER_TYPES } from '@/components/dashboard/views'

// Navigation items for each role type
const getNavItems = (role: string) => {
  // Admin navigation - observer/gatekeeper tools only
  if (role === 'admin') {
    return [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/dashboard/law-firms', label: 'Law Firms', icon: Building },
      { href: '/dashboard/orders', label: 'Orders', icon: FileText },
      { href: '/dashboard/users', label: 'Users', icon: Users },
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    ]
  }

  // Law Firm / Service Provider navigation
  if (SERVICE_PROVIDER_TYPES.includes(role as typeof SERVICE_PROVIDER_TYPES[number])) {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/pipeline', label: 'Pipeline', icon: GitBranch, badge: true },
      { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
      { href: '/dashboard/connections', label: 'Connections', icon: Link2 },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ]
  }

  // Attorney navigation
  if (role === 'attorney') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/orders', label: 'My Orders', icon: FileText },
      { href: '/dashboard/profile', label: 'Profile', icon: Users },
    ]
  }

  // Real Estate Agent navigation
  if (role === 'real_estate_agent') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/transactions', label: 'Transactions', icon: FileText },
      { href: '/dashboard/clients', label: 'My Clients', icon: Users },
      { href: '/dashboard/law-firms', label: 'Law Firms', icon: Building },
      { href: '/dashboard/profile', label: 'Profile', icon: Users },
    ]
  }

  // Closing Coordinator navigation
  if (role === 'closing_coordinator') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/transactions', label: 'Transactions', icon: FileText },
      { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
      { href: '/dashboard/tasks', label: 'Tasks', icon: ClipboardList },
      { href: '/dashboard/profile', label: 'Profile', icon: Users },
    ]
  }

  // Lender / Loan Processor navigation
  if (role === 'lender' || role === 'loan_processor') {
    return [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/loans', label: 'My Loans', icon: DollarSign },
      { href: '/dashboard/closings', label: 'Closings', icon: FileText },
      { href: '/dashboard/law-firms', label: 'Law Firms', icon: Building },
      { href: '/dashboard/profile', label: 'Profile', icon: Users },
    ]
  }

  // Customer navigation (default)
  return [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/pipeline', label: 'Pipeline', icon: GitBranch },
    { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
    { href: '/dashboard/connections', label: 'Connections', icon: Link2 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]
}

// Theme colors for each role
const getRoleTheme = (role: string) => {
  if (role === 'admin') return { bg: 'bg-purple-600', hover: 'hover:bg-purple-50', active: 'bg-purple-50 text-purple-700' }
  if (role === 'attorney') return { bg: 'bg-green-600', hover: 'hover:bg-green-50', active: 'bg-green-50 text-green-700' }
  if (role === 'real_estate_agent') return { bg: 'bg-green-600', hover: 'hover:bg-green-50', active: 'bg-green-50 text-green-700' }
  if (role === 'closing_coordinator') return { bg: 'bg-teal-600', hover: 'hover:bg-teal-50', active: 'bg-teal-50 text-teal-700' }
  if (role === 'lender' || role === 'loan_processor') return { bg: 'bg-amber-600', hover: 'hover:bg-amber-50', active: 'bg-amber-50 text-amber-700' }
  if (SERVICE_PROVIDER_TYPES.includes(role as typeof SERVICE_PROVIDER_TYPES[number])) {
    return { bg: 'bg-blue-600', hover: 'hover:bg-blue-50', active: 'bg-blue-50 text-blue-700' }
  }
  return { bg: 'bg-blue-600', hover: 'hover:bg-blue-50', active: 'bg-blue-50 text-blue-700' }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Live data state
  const [lawFirmName, setLawFirmName] = useState<string>('My Firm')
  const [lawFirmSlug, setLawFirmSlug] = useState<string | null>(null)
  const [pipelineCount, setPipelineCount] = useState<number>(0)

  useEffect(() => {
    if (isLoading) return

    if (!user) {
      router.push('/search')
      return
    }

    if (!profile) return

    // Redirect to onboarding if not completed (but not for admins)
    if (!profile.onboarding_completed && !profile.profile_type && profile.role !== 'admin') {
      router.push('/onboarding')
      return
    }
  }, [isLoading, user, profile, router])

  // Fetch law firm data and setup progress for service providers
  useEffect(() => {
    if (!user || !profile) return

    const roleName = profile.profile_type || profile.role || 'customer'
    const isServiceProvider = SERVICE_PROVIDER_TYPES.includes(roleName as typeof SERVICE_PROVIDER_TYPES[number])

    if (!isServiceProvider) return

    const fetchLawFirmData = async () => {
      const supabase = createClient()

      // First, find the law firm owned by this user
      const { data: lawFirm, error: lawFirmError } = await supabase
        .from('law_firms')
        .select('id, name, slug')
        .eq('owner_id', user.id)
        .single()

      if (lawFirmError || !lawFirm) {
        // User might be an attorney at a law firm instead
        const { data: attorney } = await supabase
          .from('attorneys')
          .select('law_firm_id, law_firm:law_firms(id, name, slug)')
          .eq('profile_id', user.id)
          .single()

        if (attorney?.law_firm) {
          const firm = attorney.law_firm as { id: string; name: string; slug: string }
          setLawFirmName(firm.name)
          setLawFirmSlug(firm.slug)
        }
        return
      }

      setLawFirmName(lawFirm.name)
      setLawFirmSlug(lawFirm.slug)

      // Fetch pipeline count (active orders)
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('law_firm_id', lawFirm.id)
        .in('status', ['new', 'in_progress'])

      setPipelineCount(count || 0)
    }

    fetchLawFirmData()
  }, [user, profile])

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Determine role from profile
  const roleName = profile.profile_type || profile.role || 'customer'
  const roleLabel = getProfileTypeLabel(roleName)
  const navItems = getNavItems(roleName)
  const theme = getRoleTheme(roleName)
  const isServiceProvider = SERVICE_PROVIDER_TYPES.includes(roleName as typeof SERVICE_PROVIDER_TYPES[number])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside
          className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${theme.bg} rounded-lg flex items-center justify-center`}>
                  {roleName === 'admin' ? (
                    <Shield className="text-white" size={20} />
                  ) : (
                    <Building className="text-white" size={20} />
                  )}
                </div>
                {!sidebarCollapsed && (
                  <div>
                    <span className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                      {roleName === 'admin' ? 'Admin' : lawFirmName}
                      <ChevronLeft size={14} className="rotate-270 text-gray-400" />
                    </span>
                    {lawFirmSlug && (
                      <Link href={`/law-firms/${lawFirmSlug}`} className="text-xs text-blue-600 hover:underline">
                        Law Firm - View Page
                      </Link>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft
                  size={18}
                  className={`text-gray-400 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* View Staff Button - Only for Service Providers */}
          {isServiceProvider && !sidebarCollapsed && (
            <div className="px-4 py-3 border-b border-gray-200">
              <Link
                href="/dashboard/attorneys"
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 w-full"
              >
                <Users size={16} />
                View Staff
              </Link>
            </div>
          )}

          {/* User Profile */}
          <div className={`px-4 py-3 border-b border-gray-200 ${sidebarCollapsed ? 'px-2' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${theme.bg} bg-opacity-20 rounded-full flex items-center justify-center`}>
                <span className={`font-semibold text-sm`} style={{ color: theme.bg.replace('bg-', '').includes('blue') ? '#2563eb' : theme.bg.includes('green') ? '#16a34a' : theme.bg.includes('purple') ? '#9333ea' : theme.bg.includes('amber') ? '#d97706' : theme.bg.includes('teal') ? '#0d9488' : '#2563eb' }}>
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              {!sidebarCollapsed && (
                <div>
                  <p className="font-medium text-gray-900 text-sm">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500">{roleLabel}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const hasBadge = 'badge' in item && item.badge
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? theme.active + ' font-medium'
                      : 'text-gray-600 ' + theme.hover + ' hover:text-gray-900'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon size={20} />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {hasBadge && pipelineCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs font-medium rounded">
                          {pipelineCount > 99 ? '99+' : pipelineCount}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-gray-200">
              <p className="text-xs text-gray-400">SCHEDULE CLOSINGS</p>
              <div className="flex gap-2 mt-1">
                <Link href="#" className="text-xs text-blue-600 hover:underline">
                  Privacy
                </Link>
                <span className="text-xs text-gray-400">-</span>
                <Link href="#" className="text-xs text-blue-600 hover:underline">
                  Terms
                </Link>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Dashboard Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {roleName === 'admin' ? 'Platform Administration' : `${roleLabel} Dashboard`}
                </h1>
                <p className="text-sm text-gray-600">
                  {roleName === 'admin'
                    ? 'Monitor platform health and manage approvals'
                    : `Welcome back, ${profile?.full_name || user.email}`
                  }
                </p>
              </div>
              {/* Hide Schedule Closing for admins - they observe, don't operate */}
              {roleName !== 'admin' && (
                <Link
                  href="/search"
                  className={`${theme.bg} text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium`}
                >
                  + Schedule Closing
                </Link>
              )}
            </div>
          </div>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  )
}

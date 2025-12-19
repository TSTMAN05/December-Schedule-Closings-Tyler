'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui'
import { Home, FileText, Users, Building, LogOut } from 'lucide-react'

export default function LawFirmLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [lawFirm, setLawFirm] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/search')
      return
    }

    if (!isLoading && profile?.role !== 'law_firm' && profile?.role !== 'admin') {
      router.push('/customer')
      return
    }

    // Fetch law firm details
    async function fetchLawFirm() {
      if (!user) return
      const supabase = createClient()
      const { data } = await supabase
        .from('law_firms')
        .select('id, name')
        .eq('owner_id', user.id)
        .single()

      if (data) setLawFirm(data)
    }

    if (user && profile?.role === 'law_firm') {
      fetchLawFirm()
    }
  }, [isLoading, user, profile, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return null

  const navItems = [
    { href: '/law-firm', label: 'Dashboard', icon: Home },
    { href: '/law-firm/orders', label: 'Orders', icon: FileText },
    { href: '/law-firm/attorneys', label: 'Attorneys', icon: Users },
    { href: '/law-firm/settings', label: 'Firm Settings', icon: Building },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{lawFirm?.name || 'Law Firm Portal'}</h1>
            <p className="text-sm text-blue-200">Law Firm Dashboard</p>
          </div>
          <div className="text-sm text-blue-200">{profile?.full_name || user.email}</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="bg-white rounded-lg shadow p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                )
              })}
              <hr className="my-2" />
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}

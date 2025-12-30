'use client'

import Link from 'next/link'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui'
import { AuthModal } from '@/components/auth'
import { User, LogOut, ChevronDown, Settings, LayoutDashboard, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { getProfileTypeLabel } from '@/lib/utils/profileTypes'

export function Header() {
  const { user, profile, isLoading, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>('sign_in')

  const getRoleDisplay = () => {
    const profileType = profile?.profile_type || profile?.role

    // Only show "Setting up..." if onboarding is explicitly false AND no profile_type is set
    if (profile?.onboarding_completed === false && !profileType) {
      return { label: 'Setting up...', color: 'bg-yellow-500', href: '/onboarding' }
    }

    // If we have a profile type, show it
    const label = getProfileTypeLabel(profileType)

    // Determine color based on profile category or type
    let color = 'bg-gray-400'
    if (profile?.profile_category === 'service_provider') {
      color = 'bg-blue-500'
    } else if (profileType === 'admin') {
      color = 'bg-purple-500'
    } else if (profileType === 'attorney') {
      color = 'bg-indigo-500'
    } else if (profile?.profile_category === 'individual') {
      color = 'bg-green-500'
    }

    // All roles go to unified /dashboard - role-based views handled there
    const href = '/dashboard'

    return { label, color, href }
  }

  const roleInfo = getRoleDisplay()

  const navLinks = [
    { href: '/company', label: 'Company' },
    { href: '/resources', label: 'Resources' },
    { href: '/faqs', label: 'FAQs' },
    { href: '/investors', label: 'Investor Relations' },
  ]

  return (
    <header className="bg-brand-blue text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <span className="text-xl font-bold">Schedule Closings</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/80 hover:text-white transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-3">
            {isLoading ? (
              <div className="h-10 w-32 bg-white/20 rounded-lg animate-pulse" />
            ) : user ? (
              <>
                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium leading-tight">
                        {profile?.full_name || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-blue-200 flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${roleInfo.color}`}></span>
                        {roleInfo.label}
                      </p>
                    </div>
                    <ChevronDown size={16} className="hidden sm:block" />
                  </button>

                  {showDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-50 py-2 border">
                        {/* User Info Header */}
                        <div className="px-4 py-2 border-b">
                          <p className="text-sm font-medium text-gray-900">
                            {profile?.full_name || user.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>

                        {/* Role Badge */}
                        <div className="px-4 py-2 border-b">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            roleInfo.color === 'bg-purple-500' ? 'bg-purple-100 text-purple-700' :
                            roleInfo.color === 'bg-blue-500' ? 'bg-blue-100 text-blue-700' :
                            roleInfo.color === 'bg-green-500' ? 'bg-green-100 text-green-700' :
                            roleInfo.color === 'bg-indigo-500' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${roleInfo.color}`}></span>
                            {roleInfo.label}
                          </span>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            href={roleInfo.href}
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowDropdown(false)}
                          >
                            <LayoutDashboard size={16} className="text-gray-400" />
                            <span>Dashboard</span>
                          </Link>
                          <Link
                            href="/settings"
                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowDropdown(false)}
                          >
                            <Settings size={16} className="text-gray-400" />
                            <span>Settings</span>
                          </Link>
                        </div>

                        <div className="border-t py-1">
                          <button
                            onClick={() => {
                              setShowDropdown(false)
                              signOut()
                            }}
                            className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                          >
                            <LogOut size={16} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Desktop Auth Buttons */}
                <div className="hidden md:flex items-center space-x-3">
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                    onClick={() => {
                      setAuthView('sign_up')
                      setShowAuthModal(true)
                    }}
                  >
                    Create My Account
                  </Button>
                  <Button
                    className="bg-white text-brand-blue hover:bg-gray-100"
                    onClick={() => {
                      setAuthView('sign_in')
                      setShowAuthModal(true)
                    }}
                  >
                    Login
                  </Button>
                </div>

                {/* Mobile Auth Button */}
                <Button
                  className="md:hidden bg-white text-brand-blue hover:bg-gray-100"
                  onClick={() => {
                    setAuthView('sign_in')
                    setShowAuthModal(true)
                  }}
                >
                  Login
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-white/10 py-4">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white/80 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!user && (
                <>
                  <hr className="border-white/10 my-2" />
                  <button
                    className="text-left text-white/80 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
                    onClick={() => {
                      setShowMobileMenu(false)
                      setAuthView('sign_up')
                      setShowAuthModal(true)
                    }}
                  >
                    Create My Account
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView={authView}
      />
    </header>
  )
}

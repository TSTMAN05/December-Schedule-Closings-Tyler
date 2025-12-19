'use client'

import Link from 'next/link'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui'
import { AuthModal } from '@/components/auth'
import { User, LogOut, Building2, Briefcase, Shield } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { user, profile, isLoading, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>('sign_in')

  const getDashboardLink = () => {
    if (!profile) return '/customer'
    switch (profile.role) {
      case 'admin':
        return '/admin'
      case 'law_firm':
        return '/law-firm'
      case 'attorney':
        return '/attorney'
      default:
        return '/customer'
    }
  }

  const getRoleIcon = () => {
    if (!profile) return <User className="h-4 w-4" />
    switch (profile.role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'law_firm':
        return <Building2 className="h-4 w-4" />
      case 'attorney':
        return <Briefcase className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <header className="bg-brand-blue text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">Schedule Closings</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/search"
              className="text-white/90 hover:text-white transition-colors"
            >
              Find Law Firms
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-9 w-20 bg-white/20 rounded-lg animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
                >
                  {getRoleIcon()}
                  <span className="hidden sm:inline">
                    {profile?.full_name || user.email}
                  </span>
                </button>

                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-20 py-1">
                      {profile?.role === 'admin' ? (
                        <Link
                          href="/admin"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowDropdown(false)}
                        >
                          <Shield className="h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      ) : (
                        <Link
                          href={getDashboardLink()}
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowDropdown(false)}
                        >
                          {getRoleIcon()}
                          <span>Dashboard</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setShowDropdown(false)
                          signOut()
                        }}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/register/law-firm"
                  className="hidden sm:flex items-center space-x-1 text-white/90 hover:text-white transition-colors"
                >
                  <Building2 className="h-4 w-4" />
                  <span>Sign Up as Law Firm</span>
                </Link>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={() => {
                    setAuthView('sign_in')
                    setShowAuthModal(true)
                  }}
                >
                  Sign In
                </Button>
                <Button
                  className="bg-white text-brand-blue hover:bg-gray-100"
                  onClick={() => {
                    setAuthView('sign_up')
                    setShowAuthModal(true)
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
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

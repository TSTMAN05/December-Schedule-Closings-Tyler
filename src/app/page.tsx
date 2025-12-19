import Link from 'next/link'
import { Button } from '@/components/ui'
import { Search, Clock, Shield } from 'lucide-react'
import { SearchHero } from '@/components/search'

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section with Address Autocomplete */}
      <SearchHero />

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Schedule Closings makes finding and booking real estate attorneys simple and fast.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="w-12 h-12 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-brand-blue" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Search
              </h3>
              <p className="text-gray-600">
                Find qualified real estate attorneys in your area by location, availability, and services.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="w-12 h-12 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-brand-blue" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Schedule
              </h3>
              <p className="text-gray-600">
                Submit your closing request with property details and preferred timeline.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="w-12 h-12 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-brand-blue" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Close
              </h3>
              <p className="text-gray-600">
                Track your order status and complete your closing with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-brand-blue rounded-2xl p-8 lg:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Schedule Your Closing?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who have found their perfect closing attorney through Schedule Closings.
            </p>
            <Link href="/search">
              <Button size="lg" className="bg-white text-brand-blue hover:bg-gray-100">
                Find Law Firms
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

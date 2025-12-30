'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, FileText, Home } from 'lucide-react'
import { Spinner } from '@/components/ui'

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Closing Request Submitted!
          </h1>

          {/* Order Number */}
          {orderNumber && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4">
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="text-lg font-semibold text-gray-900">{orderNumber}</p>
            </div>
          )}

          {/* Description */}
          <p className="text-gray-600 mb-8">
            Your closing request has been sent to the law firm. They will review your
            request and contact you shortly to confirm the details.
          </p>

          {/* What's Next */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">1</span>
                <span>The law firm will review your request</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">2</span>
                <span>An attorney will be assigned to your closing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">3</span>
                <span>You'll receive confirmation with next steps</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full bg-brand-blue text-white px-6 py-3 rounded-lg hover:bg-brand-blue-light transition-colors font-medium"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/search"
              className="flex items-center justify-center gap-2 w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Questions? Contact the law firm directly or email{' '}
          <a href="mailto:support@scheduleclosings.com" className="text-blue-600 hover:underline">
            support@scheduleclosings.com
          </a>
        </p>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}

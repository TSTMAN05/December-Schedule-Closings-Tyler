import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function LawFirmRegistrationSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h1>
        <p className="text-gray-600 mb-6">
          Your law firm registration is pending approval. We'll review your application and notify
          you by email once approved. This usually takes 1-2 business days.
        </p>
        <div className="space-y-3">
          <Link
            href="/law-firm"
            className="block w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="block w-full border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}

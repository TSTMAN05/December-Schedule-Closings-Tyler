import { Suspense } from 'react'
import { SearchResults } from '@/components/search'
import { Spinner } from '@/components/ui'

export const metadata = {
  title: 'Find Law Firms | Schedule Closings',
  description: 'Search for real estate closing attorneys in your area',
}

function SearchLoading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

export default function SearchPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden">
      {/* Page Header - full width */}
      <div className="bg-white border-b py-6 px-4 shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Select a Law Firm for Your Closings
        </h1>
        <p className="text-gray-600 mt-1">
          Search and compare qualified real estate attorneys in your area
        </p>
      </div>

      {/* Search Results - full width */}
      <div className="flex-1 w-full overflow-hidden">
        <Suspense fallback={<SearchLoading />}>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  )
}

'use client'

import { TransactionTab } from '@/types'
import { cn } from '@/lib/utils'

interface TabConfig {
  id: TransactionTab
  label: string
  badge?: number
}

const TABS: TabConfig[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'documents', label: 'Documents' },
  { id: 'appointments', label: 'Appointments' },
  { id: 'notary', label: 'Notary' },
  { id: 'parties', label: 'Parties' },
  { id: 'chats', label: 'Chats' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'title_search', label: 'Title Search' },
  { id: 'title_insurance', label: 'Title Insurance' },
  { id: 'history', label: 'History' },
]

interface TransactionTabsProps {
  activeTab: TransactionTab
  onTabChange: (tab: TransactionTab) => void
  badges?: Partial<Record<TransactionTab, number>>
}

export function TransactionTabs({
  activeTab,
  onTabChange,
  badges = {},
}: TransactionTabsProps) {
  return (
    <div className="border-b bg-white">
      <nav className="flex px-6 -mb-px overflow-x-auto" aria-label="Tabs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const badge = badges[tab.id] || tab.badge

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
              {badge !== undefined && badge > 0 && (
                <span
                  className={cn(
                    'ml-2 px-2 py-0.5 text-xs rounded-full',
                    isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

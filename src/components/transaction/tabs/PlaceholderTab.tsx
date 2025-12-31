'use client'

import { TransactionTab } from '@/types'
import {
  FileText,
  Calendar,
  Users,
  MessageCircle,
  CheckSquare,
  Search,
  Shield,
  History,
  Stamp,
} from 'lucide-react'

const TAB_CONFIG: Record<
  TransactionTab,
  { icon: React.ElementType; title: string; description: string }
> = {
  summary: {
    icon: FileText,
    title: 'Summary',
    description: 'Overview of the transaction details',
  },
  documents: {
    icon: FileText,
    title: 'Documents',
    description: 'Upload and manage transaction documents. Share files with relevant parties.',
  },
  appointments: {
    icon: Calendar,
    title: 'Appointments',
    description: 'Schedule and manage closing appointments, signings, and walkthroughs.',
  },
  notary: {
    icon: Stamp,
    title: 'Notary',
    description: 'Manage notary assignments and notarization requirements.',
  },
  parties: {
    icon: Users,
    title: 'Parties',
    description: 'View and manage all parties involved in this transaction.',
  },
  chats: {
    icon: MessageCircle,
    title: 'Chats',
    description: 'Communicate with transaction parties',
  },
  tasks: {
    icon: CheckSquare,
    title: 'Tasks',
    description: 'Track and manage tasks for this transaction. Assign to team members.',
  },
  title_search: {
    icon: Search,
    title: 'Title Search',
    description: 'Manage title search orders and review results.',
  },
  title_insurance: {
    icon: Shield,
    title: 'Title Insurance',
    description: 'Handle title insurance policies and commitments.',
  },
  history: {
    icon: History,
    title: 'History',
    description: 'View complete audit trail of all transaction activity.',
  },
}

interface PlaceholderTabProps {
  tab: TransactionTab
}

export function PlaceholderTab({ tab }: PlaceholderTabProps) {
  const config = TAB_CONFIG[tab]
  const Icon = config.icon

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{config.title}</h3>
      <p className="text-gray-500 max-w-md">{config.description}</p>
      <p className="text-sm text-gray-400 mt-4">Coming soon...</p>
    </div>
  )
}

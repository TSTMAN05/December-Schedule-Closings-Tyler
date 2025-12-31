'use client'

import { TransactionStatus } from '@/types'
import { Check } from 'lucide-react'

interface StatusStep {
  id: TransactionStatus
  label: string
}

const STATUS_STEPS: StatusStep[] = [
  { id: 'new', label: 'New' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'ready_to_close', label: 'Ready to Close' },
  { id: 'closed', label: 'Closed' },
  { id: 'post_closing', label: 'In Post Closing' },
  { id: 'complete', label: 'Complete' },
]

// Separate cancelled status - shown differently
const CANCELLED_STATUS: StatusStep = { id: 'cancelled', label: 'Cancel' }

interface TransactionStatusFlowProps {
  currentStatus: TransactionStatus
  onStatusChange?: (status: TransactionStatus) => void
  disabled?: boolean
}

export function TransactionStatusFlow({
  currentStatus,
  onStatusChange,
  disabled = false,
}: TransactionStatusFlowProps) {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.id === currentStatus)
  const isCancelled = currentStatus === 'cancelled'

  const getStepStyle = (index: number, stepId: TransactionStatus) => {
    if (isCancelled) {
      return 'bg-gray-100 text-gray-400 border-gray-200'
    }

    if (index < currentIndex) {
      // Completed step
      return 'bg-blue-600 text-white border-blue-600'
    } else if (index === currentIndex) {
      // Current step
      return 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200'
    } else {
      // Future step
      return 'bg-white text-gray-500 border-gray-300 hover:border-blue-400 hover:text-blue-600'
    }
  }

  const getConnectorStyle = (index: number) => {
    if (isCancelled) {
      return 'bg-gray-200'
    }
    if (index < currentIndex) {
      return 'bg-blue-600'
    }
    return 'bg-gray-200'
  }

  const handleStepClick = (status: TransactionStatus) => {
    if (disabled || !onStatusChange) return
    onStatusChange(status)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STATUS_STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Step button */}
            <button
              type="button"
              onClick={() => handleStepClick(step.id)}
              disabled={disabled}
              className={`
                relative flex items-center justify-center px-4 py-2 text-xs font-medium
                border rounded-full transition-all duration-200
                ${getStepStyle(index, step.id)}
                ${!disabled && onStatusChange ? 'cursor-pointer' : 'cursor-default'}
                whitespace-nowrap
              `}
            >
              {index < currentIndex && !isCancelled ? (
                <Check className="h-3 w-3 mr-1" />
              ) : null}
              {step.label}
            </button>

            {/* Connector line */}
            {index < STATUS_STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 ${getConnectorStyle(index)}`}
              />
            )}
          </div>
        ))}

        {/* Cancel button - always at the end */}
        <div className="ml-4">
          <button
            type="button"
            onClick={() => handleStepClick('cancelled')}
            disabled={disabled}
            className={`
              px-4 py-2 text-xs font-medium border rounded-full transition-all duration-200
              ${isCancelled
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-500 border-gray-300 hover:border-red-400 hover:text-red-600'
              }
              ${!disabled && onStatusChange ? 'cursor-pointer' : 'cursor-default'}
            `}
          >
            {CANCELLED_STATUS.label}
          </button>
        </div>
      </div>
    </div>
  )
}

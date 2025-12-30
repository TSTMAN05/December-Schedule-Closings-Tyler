'use client'

import { forwardRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface CurrencyInputProps {
  label?: string
  error?: string
  helperText?: string
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  required?: boolean
  className?: string
  name?: string
}

// Format a number string to currency format (e.g., "1234567.89" -> "1,234,567.89")
const formatToCurrency = (value: string): string => {
  if (!value) return ''

  // Remove all non-digit characters except decimal point
  const cleanValue = value.replace(/[^\d.]/g, '')

  // Split by decimal point
  const parts = cleanValue.split('.')

  // Format the integer part with commas
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  // Limit decimal to 2 places
  const decimalPart = parts[1] ? `.${parts[1].slice(0, 2)}` : ''

  return integerPart + decimalPart
}

// Parse currency format back to plain number string (e.g., "1,234,567.89" -> "1234567.89")
const parseCurrencyToNumber = (value: string): string => {
  return value.replace(/,/g, '')
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, label, error, helperText, value = '', onChange, onBlur, placeholder = '0.00', required, name }, ref) => {
    const [displayValue, setDisplayValue] = useState('')

    // Update display value when prop value changes
    useEffect(() => {
      if (value) {
        setDisplayValue(formatToCurrency(value))
      } else {
        setDisplayValue('')
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      // Allow only digits, commas, and one decimal point
      const sanitized = inputValue.replace(/[^\d,.]/, '')

      // Prevent multiple decimal points
      const decimalCount = (sanitized.match(/\./g) || []).length
      if (decimalCount > 1) return

      // Format the display value
      const formatted = formatToCurrency(sanitized)
      setDisplayValue(formatted)

      // Pass the plain number (without commas) to the form
      const numericValue = parseCurrencyToNumber(formatted)
      onChange?.(numericValue)
    }

    const handleBlur = () => {
      // On blur, ensure proper formatting
      if (displayValue) {
        const numericValue = parseCurrencyToNumber(displayValue)
        const formatted = formatToCurrency(numericValue)
        setDisplayValue(formatted)
      }
      onBlur?.()
    }

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            ref={ref}
            type="text"
            inputMode="decimal"
            name={name}
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn(
              'w-full pl-7 pr-3 py-2 border rounded-lg shadow-sm transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent',
              'placeholder:text-gray-400',
              error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
              className
            )}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

export { CurrencyInput }

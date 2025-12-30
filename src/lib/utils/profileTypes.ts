export const PROFILE_TYPE_LABELS: Record<string, string> = {
  // Service Providers
  law_firm: 'Law Firm',
  title_company: 'Title Company',
  title_search: 'Title Search',
  title_insurance: 'Title Insurance',
  notary: 'Notary',
  // Individuals
  customer: 'Customer',
  real_estate_agent: 'Real Estate Agent',
  closing_coordinator: 'Closing Coordinator',
  lender: 'Loan Officer',
  loan_processor: 'Loan Processor',
  // Legacy roles
  admin: 'Administrator',
  attorney: 'Attorney',
}

export function getProfileTypeLabel(profileType: string | null | undefined): string {
  if (!profileType) return 'User'
  return (
    PROFILE_TYPE_LABELS[profileType] ||
    profileType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
  )
}

export function getProfileTypeColor(profileType: string | null | undefined): string {
  if (!profileType) return 'text-gray-500'

  const serviceProviders = ['law_firm', 'title_company', 'title_search', 'title_insurance', 'notary']
  if (serviceProviders.includes(profileType)) {
    return 'text-blue-600'
  }

  if (profileType === 'admin') {
    return 'text-purple-600'
  }

  if (profileType === 'attorney') {
    return 'text-indigo-600'
  }

  return 'text-green-600'
}

export function getProfileTypeBadgeColor(profileType: string | null | undefined): string {
  if (!profileType) return 'bg-gray-100 text-gray-600'

  const serviceProviders = ['law_firm', 'title_company', 'title_search', 'title_insurance', 'notary']
  if (serviceProviders.includes(profileType)) {
    return 'bg-blue-100 text-blue-700'
  }

  if (profileType === 'admin') {
    return 'bg-purple-100 text-purple-700'
  }

  if (profileType === 'attorney') {
    return 'bg-indigo-100 text-indigo-700'
  }

  return 'bg-green-100 text-green-700'
}

export { CustomerView } from './customer-view'
export { AdminView } from './admin-view'
export { LawFirmView } from './law-firm-view'
export { AttorneyView } from './attorney-view'
export { RealEstateAgentView } from './real-estate-agent-view'
export { ClosingCoordinatorView } from './closing-coordinator-view'
export { LenderView } from './lender-view'

// Service provider types that share the law firm view
export const SERVICE_PROVIDER_TYPES = [
  'law_firm',
  'title_company',
  'title_search',
  'title_insurance',
  'notary',
] as const

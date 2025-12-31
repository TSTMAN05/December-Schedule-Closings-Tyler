// Legacy UserRole type - deprecated, use ProfileType instead
export type UserRole = 'customer' | 'attorney' | 'law_firm' | 'admin'
export type CustomerType = 'buyer' | 'seller' | 'real_estate_agent' | 'lender' | 'other'
export type ClosingType = 'purchase' | 'refinance' | 'heloc' | 'other'
export type PropertyType = 'residential' | 'commercial'
export type OrderStatus = 'new' | 'in_progress' | 'completed' | 'cancelled'
export type LawFirmStatus = 'pending' | 'active' | 'inactive'

// New types for dashboard enhancements
export type OrderType = 'closing' | 'notary' | 'title'
export type TitleStatus = 'unassigned' | 'no_title_needed' | 'in_process' | 'waiting_for_review' | 'complete'
export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'
export type StaffRole = 'attorney' | 'paralegal' | 'closing_agent' | 'notary' | 'admin_staff'
export type ContactType = 'attorney' | 'paralegal' | 'lender' | 'loan_officer' | 'real_estate_agent' | 'title_agent' | 'notary' | 'other'
export type ActivityEntityType = 'order' | 'task' | 'contact' | 'attorney' | 'law_firm' | 'document'
export type ActivityAction = 'created' | 'updated' | 'deleted' | 'assigned' | 'status_changed' | 'commented' | 'uploaded'

// Profile category for service providers vs individuals
export type ProfileCategory = 'service_provider' | 'individual'

// Profile types for detailed user categorization
export type ProfileType =
  | 'law_firm'
  | 'title_company'
  | 'title_search'
  | 'title_insurance'
  | 'notary'
  | 'customer'
  | 'real_estate_agent'
  | 'closing_coordinator'
  | 'lender'
  | 'loan_processor'
  | 'admin'
  | 'attorney'

// Profile - extends Supabase auth.users
export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole // Deprecated - kept for backwards compatibility, use profile_type
  customer_type: CustomerType | null
  avatar_url: string | null
  profile_type: ProfileType | null // Primary field for user type
  profile_category: ProfileCategory | null
  onboarding_completed: boolean | null
  onboarding_step: number | null
  referral_source: string | null
  referral_details: string | null
  is_disabled: boolean | null // Soft lock for users
  disabled_at: string | null
  disabled_reason: string | null
  // Additional contact info
  mobile_phone: string | null
  office_phone: string | null
  show_office_number: boolean | null
  company_name: string | null
  // Notification preferences
  notify_email_updates: boolean | null
  notify_order_status: boolean | null
  notify_closing_reminders: boolean | null
  notify_marketing: boolean | null
  created_at: string
  updated_at: string
}

// Helper to get effective profile type (prioritizes profile_type over role)
export function getEffectiveProfileType(profile: Profile | null): ProfileType | null {
  if (!profile) return null
  // profile_type is the primary field
  if (profile.profile_type) return profile.profile_type
  // Fall back to role for legacy data
  if (profile.role) return profile.role as ProfileType
  return 'customer'
}

// Check if user is admin
export function isAdmin(profile: Profile | null): boolean {
  return getEffectiveProfileType(profile) === 'admin'
}

// Law Firm
export interface LawFirm {
  id: string
  owner_id: string | null
  name: string
  slug: string
  email: string
  phone: string
  website: string | null
  logo_url: string | null
  description: string | null
  status: LawFirmStatus
  is_disabled: boolean | null // Soft lock
  disabled_at: string | null
  disabled_reason: string | null
  approved_at: string | null
  approved_by: string | null
  created_at: string
  updated_at: string
  // Nested relations
  office_locations?: OfficeLocation[]
  attorneys?: Attorney[]
}

// Admin Note - for internal admin notes on entities
export interface AdminNote {
  id: string
  entity_type: 'law_firm' | 'user' | 'order'
  entity_id: string
  author_id: string
  note: string
  created_at: string
  // Nested relations
  author?: Profile
}

// Office Location
export interface OfficeLocation {
  id: string
  law_firm_id: string
  name: string
  street_address: string
  city: string
  state: string
  zip_code: string
  latitude: number | null
  longitude: number | null
  phone: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
  // Nested relations
  law_firm?: LawFirm
}

// Attorney / Staff
export interface Attorney {
  id: string
  profile_id: string
  law_firm_id: string
  title: string | null
  bar_number: string | null
  is_active: boolean
  is_disabled: boolean | null // Soft lock
  disabled_at: string | null
  disabled_reason: string | null
  // Staff enhancements
  staff_role: StaffRole | null
  can_be_assigned: boolean | null
  max_assignments: number | null
  current_assignments: number | null
  direct_phone: string | null
  direct_email: string | null
  created_at: string
  updated_at: string
  // Nested relations
  profile?: Profile
  law_firm?: LawFirm
}

// Order
export interface Order {
  id: string
  order_number: string
  customer_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_role: CustomerType
  property_street: string
  property_city: string
  property_state: string
  property_zip: string
  property_type: PropertyType
  closing_type: ClosingType
  estimated_closing_date: string | null
  sale_amount: number | null
  law_firm_id: string
  office_location_id: string | null
  assigned_attorney_id: string | null
  status: OrderStatus
  notes: string | null
  // New order fields
  order_type: OrderType | null
  title_status: TitleStatus | null
  closing_time: string | null
  closing_location: string | null
  seller_name: string | null
  buyer_name: string | null
  needs_date: boolean | null
  needs_time: boolean | null
  needs_location: boolean | null
  closing_calendar_id: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  // Nested relations
  customer?: Profile
  law_firm?: LawFirm
  office_location?: OfficeLocation
  assigned_attorney?: Attorney
  order_notes?: OrderNote[]
  order_tasks?: OrderTask[]
  closing_calendar?: ClosingCalendar
}

// Order Note
export interface OrderNote {
  id: string
  order_id: string
  author_id: string
  note: string
  is_internal: boolean
  created_at: string
  // Nested relations
  author?: Profile
  order?: Order
}

// Form types for creating/updating
export interface CreateOrderInput {
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_role: CustomerType
  property_street: string
  property_city: string
  property_state: string
  property_zip: string
  property_type: PropertyType
  closing_type: ClosingType
  estimated_closing_date?: string
  sale_amount?: number
  law_firm_id: string
  office_location_id?: string
  notes?: string
}

export interface UpdateOrderInput {
  status?: OrderStatus
  assigned_attorney_id?: string
  notes?: string
}

export interface CreateLawFirmInput {
  name: string
  email: string
  phone: string
  website?: string
  description?: string
}

export interface CreateOfficeLocationInput {
  law_firm_id: string
  name: string
  street_address: string
  city: string
  state: string
  zip_code: string
  latitude?: number
  longitude?: number
  phone?: string
  is_primary?: boolean
}

// ============================================
// NEW DASHBOARD TYPES
// ============================================

// Order Task
export interface OrderTask {
  id: string
  order_id: string
  title: string
  description: string | null
  assigned_to: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  // Nested relations
  order?: Order
  assignee?: Profile
  creator?: Profile
}

// Law Firm Setup Progress
export interface LawFirmSetup {
  id: string
  law_firm_id: string
  admin_account_complete: boolean
  firm_account_complete: boolean
  company_forms_complete: boolean
  fees_complete: boolean
  bank_info_complete: boolean
  insurance_complete: boolean
  ein_number: string | null
  bank_account_last4: string | null
  insurance_policy_number: string | null
  insurance_expiry: string | null
  created_at: string
  updated_at: string
  // Nested relations
  law_firm?: LawFirm
}

// Contact
export interface Contact {
  id: string
  owner_id: string
  contact_profile_id: string | null
  contact_name: string
  contact_email: string | null
  contact_phone: string | null
  company_name: string | null
  contact_type: ContactType
  notes: string | null
  is_favorite: boolean
  last_interaction_at: string | null
  created_at: string
  updated_at: string
  // Nested relations
  owner?: Profile
  contact_profile?: Profile
}

// Closing Calendar
export interface ClosingCalendar {
  id: string
  law_firm_id: string
  name: string
  description: string | null
  color: string
  is_default: boolean
  created_at: string
  updated_at: string
  // Nested relations
  law_firm?: LawFirm
}

// Activity Log
export interface ActivityLog {
  id: string
  user_id: string | null
  entity_type: ActivityEntityType
  entity_id: string
  action: ActivityAction
  description: string | null
  old_value: Record<string, unknown> | null
  new_value: Record<string, unknown> | null
  law_firm_id: string | null
  order_id: string | null
  created_at: string
  // Nested relations
  user?: Profile
  law_firm?: LawFirm
  order?: Order
}

// Setup Progress Helper Type
export interface SetupProgress {
  completed: number
  total: number
  items: boolean[]
}

// Dashboard Stats
export interface DashboardStats {
  totalOrders: number
  activeOrders: number
  completedOrders: number
  cancelledOrders: number
  pendingTasks: number
  upcomingClosings: number
}

// Pipeline Stats
export interface PipelineStats {
  all: number
  closing: number
  notary: number
  dateNeeded: number
  locationNeeded: number
  timeNeeded: number
  unassigned: number
  noTitleNeeded: number
  inProcess: number
  waitingForReview: number
  newToAccept: number
  pending: number
  readyToClose: number
  closedLast30: number
}

// ============================================
// TRANSACTION WINDOW TYPES
// ============================================

// Transaction/Deal status - follows the closing workflow
export type TransactionStatus =
  | 'new'
  | 'in_progress'
  | 'ready_to_close'
  | 'closed'
  | 'post_closing'
  | 'complete'
  | 'cancelled'

// Transaction tabs
export type TransactionTab =
  | 'summary'
  | 'documents'
  | 'appointments'
  | 'notary'
  | 'parties'
  | 'chats'
  | 'tasks'
  | 'title_search'
  | 'title_insurance'
  | 'history'

// Transaction party side
export type TransactionSide = 'buyer' | 'seller'

// Transaction party role for the deal
export type TransactionPartyRole =
  | 'buyer'
  | 'seller'
  | 'buyer_attorney'
  | 'seller_attorney'
  | 'buyer_paralegal'
  | 'seller_paralegal'
  | 'buyer_agent'
  | 'seller_agent'
  | 'lender'
  | 'loan_processor'
  | 'title_agent'
  | 'notary'
  | 'closing_coordinator'

// Transaction party - a participant in the deal
export interface TransactionParty {
  id: string
  transaction_id: string
  profile_id: string | null
  role: TransactionPartyRole
  side: TransactionSide
  name: string
  email: string
  phone: string | null
  company: string | null
  is_primary: boolean
  can_edit: boolean
  can_view_documents: boolean
  can_message: boolean
  created_at: string
  updated_at: string
  // Nested
  profile?: Profile
}

// Transaction message/chat
export interface TransactionMessage {
  id: string
  transaction_id: string
  sender_id: string
  recipient_id: string | null // null = group message to all allowed parties
  content: string
  is_read: boolean
  read_at: string | null
  created_at: string
  // Nested
  sender?: Profile
  recipient?: Profile
}

// Transaction document
export interface TransactionDocument {
  id: string
  transaction_id: string
  uploaded_by: string
  name: string
  file_url: string
  file_type: string
  file_size: number
  category: string | null
  is_shared: boolean
  shared_with_sides: TransactionSide[]
  created_at: string
  // Nested
  uploader?: Profile
}

// Transaction appointment
export interface TransactionAppointment {
  id: string
  transaction_id: string
  title: string
  description: string | null
  appointment_type: 'closing' | 'signing' | 'walkthrough' | 'inspection' | 'other'
  scheduled_at: string
  duration_minutes: number
  location: string | null
  is_virtual: boolean
  virtual_link: string | null
  created_by: string
  created_at: string
  updated_at: string
  // Nested
  creator?: Profile
  attendees?: TransactionParty[]
}

// Transaction history/activity log entry
export interface TransactionHistoryEntry {
  id: string
  transaction_id: string
  user_id: string | null
  action: string
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
  // Nested
  user?: Profile
}

// Main Transaction/Deal interface
export interface Transaction {
  id: string
  order_id: string // Links back to the original order
  deal_number: string
  property_address: string
  property_city: string
  property_state: string
  property_zip: string
  deal_type: ClosingType
  financing_type: string | null
  sale_price: number | null
  closing_date: string | null
  closing_time: string | null
  closing_location: string | null
  status: TransactionStatus
  buyer_side_law_firm_id: string | null
  seller_side_law_firm_id: string | null
  buyer_side_paralegal_id: string | null
  seller_side_paralegal_id: string | null
  created_at: string
  updated_at: string
  // Nested relations
  order?: Order
  buyer_side_law_firm?: LawFirm
  seller_side_law_firm?: LawFirm
  buyer_side_paralegal?: Attorney
  seller_side_paralegal?: Attorney
  parties?: TransactionParty[]
  messages?: TransactionMessage[]
  documents?: TransactionDocument[]
  appointments?: TransactionAppointment[]
  history?: TransactionHistoryEntry[]
}

// User's role context in a transaction
export interface TransactionUserContext {
  transaction_id: string
  user_id: string
  role: TransactionPartyRole
  side: TransactionSide
  can_edit: boolean
  can_view_all_documents: boolean
  can_message_all: boolean
  allowed_message_parties: string[] // party IDs user can message
}

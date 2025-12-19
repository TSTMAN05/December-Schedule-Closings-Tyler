// User role types matching database ENUM
export type UserRole = 'customer' | 'attorney' | 'law_firm' | 'admin'
export type CustomerType = 'buyer' | 'seller' | 'real_estate_agent' | 'lender' | 'other'
export type ClosingType = 'purchase' | 'refinance' | 'heloc' | 'other'
export type PropertyType = 'residential' | 'commercial'
export type OrderStatus = 'new' | 'in_progress' | 'completed' | 'cancelled'
export type LawFirmStatus = 'pending' | 'active' | 'inactive'

// Profile - extends Supabase auth.users
export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  customer_type: CustomerType | null
  avatar_url: string | null
  created_at: string
  updated_at: string
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
  created_at: string
  updated_at: string
  // Nested relations
  office_locations?: OfficeLocation[]
  attorneys?: Attorney[]
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

// Attorney
export interface Attorney {
  id: string
  profile_id: string
  law_firm_id: string
  title: string | null
  bar_number: string | null
  is_active: boolean
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
  created_at: string
  updated_at: string
  completed_at: string | null
  // Nested relations
  customer?: Profile
  law_firm?: LawFirm
  office_location?: OfficeLocation
  assigned_attorney?: Attorney
  order_notes?: OrderNote[]
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

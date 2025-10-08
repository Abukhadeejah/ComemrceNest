// Customer-related TypeScript types matching database schema

export interface Customer {
  id: string
  tenant_id: string
  user_id: string | null
  email: string
  phone: string | null
  first_name: string | null
  last_name: string | null
  dob: string | null // ISO date string
  gender: string | null
  marketing_opt_in: boolean
  created_at: string
  updated_at: string
}

export interface CustomerAddress {
  id: string
  tenant_id: string
  customer_id: string
  // Common canonical fields
  name: string | null
  full_name?: string
  phone: string
  line1: string
  line2: string | null
  address_line_1?: string
  address_line_2?: string | null
  city: string
  state: string
  pincode: string
  postal_code?: string
  country: string
  type?: 'shipping' | 'billing'
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface WalletAccount {
  id: string
  tenant_id: string
  customer_id: string
  balance?: number
  balance_cents?: number
  created_at: string
}

export interface WalletLedgerEntry {
  id: string
  tenant_id?: string
  account_id?: string
  entry_type?: 'credit' | 'debit'
  type?: 'credit' | 'debit'
  amount_cents: number
  amount?: number
  currency?: string
  source_key?: string
  reference_id?: string | null
  metadata?: Record<string, unknown>
  description?: string
  balance_after?: number
  created_at: string
}

export interface WalletBalance {
  account_id: string
  balance_cents: number
  currency: string
}

// API Request/Response types
export interface CustomerRegistrationRequest {
  email: string
  password: string
  phone?: string
  firstName?: string
  lastName?: string
  marketingOptIn?: boolean
}

export interface CustomerRegistrationResponse {
  success: boolean
  customer: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    phone: string | null
    marketing_opt_in: boolean
  }
  user: {
    id: string
    email: string
  }
}

export interface CustomerProfileResponse {
  customer: {
    id: string
    email: string
    phone: string | null
    first_name: string | null
    last_name: string | null
    dob: string | null
    gender: string | null
    marketing_opt_in: boolean
    created_at: string
    updated_at: string
  }
}

export interface CustomerProfileUpdateRequest {
  phone?: string
  firstName?: string
  lastName?: string
  dob?: string
  gender?: string
  marketingOptIn?: boolean
}

export interface AddressCreateRequest {
  name?: string
  phone?: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  country?: string
  isDefault?: boolean
}

export interface AddressUpdateRequest extends AddressCreateRequest {
  id?: string
}

export interface WalletResponse {
  wallet: WalletBalance & { balance?: number }
  transactions: WalletLedgerEntry[]
}

// Admin types (for backward compatibility)
export interface AdminCustomer extends Pick<Customer, 'id' | 'email' | 'first_name' | 'last_name' | 'phone' | 'created_at'> {
  total_orders: number
  total_spent_cents: number
}

export interface AdminCustomerList {
  data: AdminCustomer[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}


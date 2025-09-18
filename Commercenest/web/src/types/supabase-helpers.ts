import { Database, Tables } from './supabase'

// Type helpers for Supabase compatibility
export type SupabaseRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type SupabaseInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type SupabaseUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Helper to safely convert null to undefined for frontend types
export function nullToUndefined<T>(value: T): T extends null ? undefined : T {
  return (value === null ? undefined : value) as T extends null ? undefined : T
}

// Helper to safely convert undefined to null for database operations  
export function undefinedToNull<T>(value: T): T extends undefined ? null : T {
  return (value === undefined ? null : value) as T extends undefined ? null : T
}

// Safe type conversion for arrays
export function adaptArray<T, U>(
  array: T[] | null | undefined,
  adapter: (item: T) => U
): U[] {
  if (!array) return []
  return array.map(adapter)
}

// Specific adapters for common types
export const ProductStatus = {
  DRAFT: 'draft' as const,
  PUBLISHED: 'published' as const,
} as const

export const OrderStatus = {
  PENDING: 'pending' as const,
  PAID: 'paid' as const,
  FAILED: 'failed' as const,
  FULFILLED: 'fulfilled' as const,
  CANCELLED: 'cancelled' as const,
} as const

export const TenantStatus = {
  ACTIVE: 'active' as const,
  SUSPENDED: 'suspended' as const,
  MAINTENANCE: 'maintenance' as const,
} as const

// Type-safe enum checkers
export function isValidProductStatus(status: string): status is Database['public']['Enums']['product_status'] {
  const vals = Object.values(ProductStatus) as readonly string[]
  return vals.includes(status)
}

export function isValidOrderStatus(status: string): status is Database['public']['Enums']['order_status'] {
  const vals = Object.values(OrderStatus) as readonly string[]
  return vals.includes(status)
}

export function isValidTenantStatus(status: string): status is Database['public']['Enums']['tenant_status'] {
  const vals = Object.values(TenantStatus) as readonly string[]
  return vals.includes(status)
}

// Helper for JSON fields that should be typed objects
export function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  if (typeof value === 'object' && value !== null) {
    return value as T
  }
  return fallback
}

// Helper for ensuring tenant_id is included in database operations
export function withTenantId<T extends Record<string, unknown>>(
  data: T,
  tenantId: string
): T & { tenant_id: string } {
  return { ...data, tenant_id: tenantId }
}

// Type-safe database insert helper
export function createInsertData<T extends keyof Database['public']['Tables']>(
  table: T,
  data: Omit<SupabaseInsert<T>, 'tenant_id'>,
  tenantId: string
): SupabaseInsert<T> {
  return { ...data, tenant_id: tenantId } as SupabaseInsert<T>
}



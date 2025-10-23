import { headers, cookies } from 'next/headers'
import { supabaseAdmin } from '@/server/supabaseAdmin'

// Cache for tenant configurations to avoid repeated database calls
const tenantConfigCache = new Map<string, { config: TenantConfig; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface TenantConfig {
  tenantId: string
  name: string
  companyProfile?: {
    name?: string
    brand_accent_hex?: string
    [key: string]: unknown
  }
  theme: {
    primaryColor: string
    secondaryColor: string
    neutralColor: string
    classes: string
  }
  features: {
    portfolio: boolean
    products: boolean
    checkout: boolean
  }
}

export async function resolveTenantIdFromRequest(): Promise<string | null> {
  const h = await headers()
  const rawHost = h.get('host') || ''
  const host = rawHost.split(':')[0]
  const pathname = h.get('x-pathname') || '/'
  const tenantAdmin = h.get('x-tenant-admin')

  if (!host) {
    return null
  }

  // 1. Try tenant admin header first (most reliable for tenant-specific routes)
  if (tenantAdmin) {
    const tenantId = await resolveTenantIdFromKey(tenantAdmin)
    if (tenantId) {
      return tenantId
    }
  }

  // 2. Try path-based resolution for tenant routes first
  const pathSegments = pathname.split('/').filter(Boolean)
  if (pathSegments.length > 0) {
    const tenantKey = pathSegments[0]
    const tenantId = await resolveTenantIdFromKey(tenantKey)
    if (tenantId) {
      return tenantId
    }
  }

  // 2b. Fallback for API routes (middleware doesn't set headers there): use tenant cookie
  try {
    const cookieStore = await cookies()
    const cookieTenant = cookieStore.get('tenant')?.value
    if (cookieTenant) {
      const cookieTenantId = await resolveTenantIdFromKey(cookieTenant)
      if (cookieTenantId) {
        return cookieTenantId
      }
    }
  } catch {}

  // 2c. Enhanced fallback: Try to infer tenant from referer or other context
  // This helps when accessing global routes like /checkout directly
  try {
    const referer = h.get('referer') || ''
    if (referer) {
      const refererUrl = new URL(referer)
      const refererPath = refererUrl.pathname
      const refererSegments = refererPath.split('/').filter(Boolean)
      
      if (refererSegments.length > 0) {
        const refererTenant = refererSegments[0]
        const refererTenantId = await resolveTenantIdFromKey(refererTenant)
        if (refererTenantId) {
          return refererTenantId
        }
      }
    }
  } catch {}

  // 3. Special handling for localhost development
  if (host === 'localhost') {
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length > 0) {
      const firstSegment = pathSegments[0].toLowerCase()

      if (firstSegment === 'bluebell') {
        return '11111111-1111-4111-8111-11111111bb01' // Bluebell Interiors
      }

      if (firstSegment === 'senlysh') {
        return '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c' // Senlysh Fashion
      }
    }

    // For root paths (/, /products, etc.), return null for platform content
    // Root routes are reserved for CommerceNest platform, not tenant-specific content
    // Ignore any host-based mappings for localhost root routes
    return null
  }

  // 4. Try host-based resolution (for custom domains) - only for non-localhost
  const { data: hostData } = await supabaseAdmin
    .from('tenant_domains')
    .select('tenant_id')
    .eq('hostname', host)
    .maybeSingle()

  if (hostData?.tenant_id) {
    return hostData.tenant_id
  }

  // 5. For production, root paths should also return null for platform content
  // Only tenant-specific paths should resolve to tenant IDs
  return null
}

// Helper function to resolve tenant ID from tenant key (name or slug)
async function resolveTenantIdFromKey(tenantKey: string): Promise<string | null> {
  // Try exact name match first
  const { data: tenantData } = await supabaseAdmin
    .from('tenants')
    .select('id, name')
    .eq('name', tenantKey)
    .maybeSingle()

  if (tenantData?.id) {
    return tenantData.id
  }

  // Try common tenant key mappings FIRST (before partial match)
  const keyMappings: Record<string, string> = {
    'bluebell': 'Bluebell Interiors',
    'senlysh': 'Senlysh Fashion',
  }

  const mappedName = keyMappings[tenantKey.toLowerCase()]
  if (mappedName) {
    const { data: mappedTenant } = await supabaseAdmin
      .from('tenants')
      .select('id, name')
      .eq('name', mappedName)
      .maybeSingle()

    if (mappedTenant?.id) {
      return mappedTenant.id
    }
  }

  // Try case-insensitive name match LAST (after key mappings)
  const { data: tenantDataCI } = await supabaseAdmin
    .from('tenants')
    .select('id, name')
    .ilike('name', `%${tenantKey}%`)
    .maybeSingle()

  if (tenantDataCI?.id) {
    return tenantDataCI.id
  }

  return null
}



export async function getPrimaryHostnameForTenant(tenantId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('tenant_domains')
    .select('hostname')
    .eq('tenant_id', tenantId)
    .eq('is_primary', true)
    .maybeSingle()
  return data?.hostname ?? null
}

export async function getRequestHostname(): Promise<string | null> {
  const h = await headers()
  const rawHost = h.get('x-tenant-host') || h.get('host') || ''
  const host = rawHost.split(':')[0]
  return host || null
}

export async function resolveTenantKeyFromId(tenantId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .maybeSingle()
  
  if (!data?.name) return null
  
  // Map tenant names to keys (this could be a separate column in the future)
  const nameToKey: Record<string, string> = {
    'Bluebell Interiors': 'bluebell',
    'Senlysh Fashion': 'senlysh',
  }
  
  return nameToKey[data.name] || null
}

// Get tenant configuration with caching
export async function getTenantConfig(tenantId: string): Promise<TenantConfig> {
  const cacheKey = `tenant_config_${tenantId}`
  const cached = tenantConfigCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.config
  }
  
  const { data: companyProfile } = await supabaseAdmin
    .from('settings_company_profile')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle()
  
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .maybeSingle()
  
  const config: TenantConfig = {
    tenantId,
    name: tenant?.name || 'Unknown Tenant',
    companyProfile: companyProfile ? {
      name: typeof (companyProfile as Record<string, unknown>).name === 'string' ? (companyProfile as Record<string, unknown>).name as string : undefined,
      brand_accent_hex: typeof (companyProfile as Record<string, unknown>).brand_accent_hex === 'string' ? (companyProfile as Record<string, unknown>).brand_accent_hex as string : undefined,
    } : undefined,
    theme: {
      primaryColor: companyProfile?.brand_accent_hex || '#01589D',
      secondaryColor: '#C9A227', // Mustard
      neutralColor: '#8B4513', // Brown
      classes: 'bg-gradient-to-br from-white via-gray-50 to-white',
    },
    features: {
      portfolio: true,
      products: true,
      checkout: true,
    }
  }
  
  tenantConfigCache.set(cacheKey, {
    config,
    timestamp: Date.now()
  })
  
  return config
}

// Clear tenant config cache (useful for testing or when configs change)
export function clearTenantConfigCache() {
  tenantConfigCache.clear()
}



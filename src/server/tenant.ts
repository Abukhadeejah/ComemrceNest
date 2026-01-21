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
  console.log('🏢 [TenantResolver] Starting tenant resolution...')
  
  const h = await headers()
  const rawHost = h.get('host') || ''
  const host = rawHost.split(':')[0]
  const pathname = h.get('x-pathname') || '/'
  const tenantAdmin = h.get('x-tenant-admin')

  console.log('🏢 [TenantResolver] Request context:', {
    host,
    pathname,
    tenantAdmin,
    rawHost
  })

  if (!host) {
    console.log('🏢 [TenantResolver] ❌ No host found')
    return null
  }

  // 1. Try tenant admin header first (most reliable for tenant-specific routes)
  if (tenantAdmin) {
    console.log('🏢 [TenantResolver] Trying tenant admin header:', tenantAdmin)
    const tenantId = await resolveTenantIdFromKey(tenantAdmin)
    if (tenantId) {
      console.log('🏢 [TenantResolver] ✅ Resolved from tenant admin header:', tenantId)
      return tenantId
    }
    console.log('🏢 [TenantResolver] ❌ Failed to resolve from tenant admin header')
  }

  // 2. Try path-based resolution for tenant routes first
  const pathSegments = pathname.split('/').filter(Boolean)
  console.log('🏢 [TenantResolver] Path segments:', pathSegments)
  
  if (pathSegments.length > 0) {
    const tenantKey = pathSegments[0]
    console.log('🏢 [TenantResolver] Trying path-based tenant key:', tenantKey)
    const tenantId = await resolveTenantIdFromKey(tenantKey)
    if (tenantId) {
      console.log('🏢 [TenantResolver] ✅ Resolved from path:', tenantId)
      return tenantId
    }
    console.log('🏢 [TenantResolver] ❌ Failed to resolve from path')
  }

  // 2b. Fallback for API routes (middleware doesn't set headers there): use tenant cookie
  try {
    const cookieStore = await cookies()
    const cookieTenant = cookieStore.get('tenant')?.value
    console.log('🏢 [TenantResolver] Cookie tenant:', cookieTenant)
    
    if (cookieTenant) {
      const cookieTenantId = await resolveTenantIdFromKey(cookieTenant)
      if (cookieTenantId) {
        console.log('🏢 [TenantResolver] ✅ Resolved from cookie:', cookieTenantId)
        return cookieTenantId
      }
      console.log('🏢 [TenantResolver] ❌ Failed to resolve from cookie')
    }
  } catch (error) {
    console.error('🏢 [TenantResolver] Error reading cookies:', error)
  }

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

  // 5. Production fallback: if we're on a production domain but no specific mapping,
  // try to infer from common patterns or default to senlysh
  if (process.env.NODE_ENV === 'production' && !host.includes('localhost')) {
    // Check if it's a Vercel deployment URL
    if (host.includes('vercel.app') || host.includes('.app')) {
      // Default to senlysh for main deployment
      return '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c' // Senlysh Fashion
    }
  }

  // 6. For production, root paths should also return null for platform content
  // Only tenant-specific paths should resolve to tenant IDs
  return null
}

// Helper function to resolve tenant ID from tenant key (name or slug)
export async function resolveTenantIdFromKey(tenantKey: string): Promise<string | null> {
  console.log('🔑 [TenantKeyResolver] Resolving tenant key:', tenantKey)
  
  // Try exact name match first
  const { data: tenantData } = await supabaseAdmin
    .from('tenants')
    .select('id, name')
    .eq('name', tenantKey)
    .maybeSingle()

  if (tenantData?.id) {
    console.log('🔑 [TenantKeyResolver] ✅ Found exact name match:', { id: tenantData.id, name: tenantData.name })
    return tenantData.id
  }

  // Try common tenant key mappings FIRST (before partial match)
  const keyMappings: Record<string, string> = {
    'bluebell': 'Bluebell Interiors',
    'senlysh': 'Senlysh Fashion',
  }

  const mappedName = keyMappings[tenantKey.toLowerCase()]
  console.log('🔑 [TenantKeyResolver] Checking key mapping:', { tenantKey: tenantKey.toLowerCase(), mappedName })
  
  if (mappedName) {
    const { data: mappedTenant } = await supabaseAdmin
      .from('tenants')
      .select('id, name')
      .eq('name', mappedName)
      .maybeSingle()

    if (mappedTenant?.id) {
      console.log('🔑 [TenantKeyResolver] ✅ Found mapped tenant:', { id: mappedTenant.id, name: mappedTenant.name })
      return mappedTenant.id
    }
    console.log('🔑 [TenantKeyResolver] ❌ Mapped name not found in database:', mappedName)
  }

  // Try case-insensitive name match LAST (after key mappings)
  const { data: tenantDataCI } = await supabaseAdmin
    .from('tenants')
    .select('id, name')
    .ilike('name', `%${tenantKey}%`)
    .maybeSingle()

  if (tenantDataCI?.id) {
    console.log('🔑 [TenantKeyResolver] ✅ Found case-insensitive match:', { id: tenantDataCI.id, name: tenantDataCI.name })
    return tenantDataCI.id
  }

  console.log('🔑 [TenantKeyResolver] ❌ No tenant found for key:', tenantKey)
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



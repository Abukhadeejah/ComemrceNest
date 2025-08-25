import { headers } from 'next/headers'
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
  const rawHost = h.get('x-tenant-host') || h.get('host') || ''
  const host = rawHost.split(':')[0]
  const pathname = h.get('x-pathname') || '/'
  const tenantAdmin = h.get('x-tenant-admin')
  
  if (!host) return null
  
  // 1. Try tenant admin header first (most reliable for tenant-specific routes)
  if (tenantAdmin) {
    const tenantId = await resolveTenantIdFromKey(tenantAdmin)
    if (tenantId) return tenantId
  }
  
  // 2. Try host-based resolution (for custom domains)
  const { data: hostData } = await supabaseAdmin
    .from('tenant_domains')
    .select('tenant_id')
    .eq('hostname', host)
    .maybeSingle()
    
  if (hostData?.tenant_id) return hostData.tenant_id
  
  // 3. Try path-based resolution for subdomain routing
  const pathSegments = pathname.split('/').filter(Boolean)
  if (pathSegments.length > 0) {
    const tenantKey = pathSegments[0]
    const tenantId = await resolveTenantIdFromKey(tenantKey)
    if (tenantId) return tenantId
  }
  
  // 4. Special handling for localhost development
  if (host === 'localhost') {
    if (pathname.startsWith('/bluebell')) {
      return await resolveTenantIdFromKey('bluebell')
    }
    // Default to Senlysh for localhost
    return await resolveTenantIdFromKey('senlysh')
  }
  
  // 5. Fallback to default tenant
  return await getDefaultTenantId()
}

// Helper function to resolve tenant ID from tenant key (name or slug)
async function resolveTenantIdFromKey(tenantKey: string): Promise<string | null> {
  // Try exact name match first
  const { data: tenantData } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('name', tenantKey)
    .maybeSingle()
  
  if (tenantData?.id) return tenantData.id
  
  // Try case-insensitive name match
  const { data: tenantDataCI } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .ilike('name', `%${tenantKey}%`)
    .maybeSingle()
  
  if (tenantDataCI?.id) return tenantDataCI.id
  
  // Try common tenant key mappings
  const keyMappings: Record<string, string> = {
    'bluebell': 'Bluebell Interiors',
    'senlysh': 'Senlysh Fashion',
  }
  
  const mappedName = keyMappings[tenantKey.toLowerCase()]
  if (mappedName) {
    const { data: mappedTenant } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('name', mappedName)
      .maybeSingle()
    
    if (mappedTenant?.id) return mappedTenant.id
  }
  
  return null
}

// Get default tenant ID (first active tenant)
async function getDefaultTenantId(): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  
  return data?.id || null
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
    companyProfile,
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



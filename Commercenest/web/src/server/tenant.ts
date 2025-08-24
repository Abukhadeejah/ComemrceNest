import { headers } from 'next/headers'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function resolveTenantIdFromRequest(): Promise<string | null> {
  const h = await headers()
  const rawHost = h.get('x-tenant-host') || h.get('host') || ''
  const host = rawHost.split(':')[0]
  const pathname = h.get('x-pathname') || '/'
  const tenantAdmin = h.get('x-tenant-admin')
  
  if (!host) return null
  
  // Handle tenant admin routes first
  if (tenantAdmin) {
    if (tenantAdmin === 'bluebell') {
      return '11111111-1111-4111-8111-11111111bb01' // Bluebell tenant ID
    } else if (tenantAdmin === 'senlysh') {
      return '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c' // Senlysh tenant ID
    }
  }
  
  // Special handling for localhost development
  if (host === 'localhost') {
    if (pathname.startsWith('/bluebell')) {
      return '11111111-1111-4111-8111-11111111bb01' // Bluebell tenant ID
    }
    return '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c' // Senlysh tenant ID (default)
  }
  
  // Check host-based routing for specific tenant domains
  const { data: hostData } = await supabaseAdmin
    .from('tenant_domains')
    .select('tenant_id, hostname')
    .eq('hostname', host)
    .maybeSingle()
    
  if (hostData?.tenant_id) return hostData.tenant_id
  
  // Fallback to path-based routing for Vercel staging
  if (host === 'comemrce-nest-8qhd9tlwk-appopoleis1.vercel.app' || host.includes('vercel.app')) {
    if (pathname.startsWith('/bluebell')) {
      return '11111111-1111-4111-8111-11111111bb01' // Bluebell tenant ID
    }
    return '1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c' // Senlysh tenant ID (default)
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



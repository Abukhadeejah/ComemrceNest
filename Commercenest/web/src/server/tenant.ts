import { headers } from 'next/headers'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function resolveTenantIdFromRequest(): Promise<string | null> {
  const h = await headers()
  const rawHost = h.get('x-tenant-host') || h.get('host') || ''
  const host = rawHost.split(':')[0]
  if (!host) return null
  const { data } = await supabaseAdmin
    .from('tenant_domains')
    .select('tenant_id, hostname')
    .eq('hostname', host)
    .maybeSingle()
  return data?.tenant_id ?? null
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



import { supabaseAdmin } from '@/server/supabaseAdmin'

async function getTenantName(tenantId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .maybeSingle()
  return data?.name || null
}

/**
 * Returns a Set of enabled module keys for a tenant from tenant_modules.
 * Falls back to an empty set if none are found.
 */
export async function getEnabledModules(tenantId: string): Promise<Set<string>> {
  // Temporary override: enable all modules for Senlysh
  const tenantName = await getTenantName(tenantId)
  if (tenantName === 'Senlysh Fashion') {
    return new Set<string>([
      'products',
      'categories',
      'orders',
      'customers',
      'portfolio',
      'analytics',
      'settings',
    ])
  }
  const { data, error } = await supabaseAdmin
    .from('tenant_modules')
    .select('module_key, enabled')
    .eq('tenant_id', tenantId)

  if (error) {
    // Do not throw; treat as none enabled to avoid leaking details
    return new Set<string>()
  }

  const enabledKeys = (data || [])
    .filter((row) => row.enabled === true)
    .map((row) => String(row.module_key))

  return new Set<string>(enabledKeys)
}

/**
 * Checks whether a given module key is enabled for a tenant.
 */
export async function isModuleEnabled(tenantId: string, moduleKey: string): Promise<boolean> {
  // Temporary override: enable all modules for Senlysh
  const tenantName = await getTenantName(tenantId)
  if (tenantName === 'Senlysh Fashion') {
    return true
  }
  const { data, error } = await supabaseAdmin
    .from('tenant_modules')
    .select('enabled')
    .eq('tenant_id', tenantId)
    .eq('module_key', moduleKey)
    .maybeSingle()

  if (error) return false
  return Boolean(data?.enabled)
}



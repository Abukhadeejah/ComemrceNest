import { supabaseAdmin } from '@/server/supabaseAdmin'

/**
 * Returns a Set of enabled module keys for a tenant from tenant_modules.
 * Falls back to an empty set if none are found.
 */
export async function getEnabledModules(tenantId: string): Promise<Set<string>> {
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
  console.log('🔧 [AdminModules] Checking module enabled:', { tenantId, moduleKey })
  
  const { data, error } = await supabaseAdmin
    .from('tenant_modules')
    .select('enabled')
    .eq('tenant_id', tenantId)
    .eq('module_key', moduleKey)
    .maybeSingle()

  console.log('🔧 [AdminModules] Module check result:', { 
    data, 
    error: error?.message,
    enabled: Boolean(data?.enabled)
  })

  if (error) {
    console.error('🔧 [AdminModules] ❌ Error checking module:', error)
    return false
  }
  
  const isEnabled = Boolean(data?.enabled)
  console.log('🔧 [AdminModules]', isEnabled ? '✅' : '❌', `Module ${moduleKey} is ${isEnabled ? 'enabled' : 'disabled'} for tenant ${tenantId}`)
  
  return isEnabled
}



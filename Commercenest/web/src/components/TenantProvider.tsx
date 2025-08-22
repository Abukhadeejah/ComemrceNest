import { resolveTenantIdFromRequest, resolveTenantKeyFromId } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { getTenantConfig } from '@/tenants'
import TenantContextProvider from './TenantContextProvider'

export default async function TenantProvider({ children }: { children: React.ReactNode }) {
  const tenantId = await resolveTenantIdFromRequest()
  const tenantKey = tenantId ? await resolveTenantKeyFromId(tenantId) : 'default'
  let accent: string | undefined
  
  if (tenantId) {
    const { data: settings } = await supabaseAdmin
      .from('settings_company_profile').select('brand_accent_hex').eq('tenant_id', tenantId).maybeSingle()
    accent = settings?.brand_accent_hex || undefined
  }
  
  const cfg = getTenantConfig(tenantKey || 'default')
  const colors = cfg.theme.colors
  const brandAccent = accent || colors.accent || colors.primary

  return (
    <TenantContextProvider config={cfg}>
      <div style={{
        ['--color-accent' as string]: brandAccent,
        ['--color-primary' as string]: colors.primary,
        ['--color-mustard' as string]: colors.mustard || '',
        ['--color-white' as string]: colors.white || '',
        ['--color-crimson' as string]: colors.crimson || '',
        ['--color-brown' as string]: colors.brown || '',
      }}>
        {children}
      </div>
    </TenantContextProvider>
  )
}



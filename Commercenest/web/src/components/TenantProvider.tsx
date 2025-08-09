import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { getTenantConfig } from '@/tenants'

export default async function TenantProvider({ children }: { children: React.ReactNode }) {
  const tenantId = await resolveTenantIdFromRequest()
  let tenantKey = 'default'
  let accent: string | undefined
  if (tenantId) {
    const { data: domain } = await supabaseAdmin
      .from('tenant_domains').select('hostname').eq('tenant_id', tenantId).eq('is_primary', true).maybeSingle()
    tenantKey = domain?.hostname?.split('.')[0] || 'default'
    const { data: settings } = await supabaseAdmin
      .from('settings_company_profile').select('brand_accent_hex').eq('tenant_id', tenantId).maybeSingle()
    accent = settings?.brand_accent_hex || undefined
  }
  const cfg = getTenantConfig(tenantKey)
  const colors = cfg.theme.colors
  const brandAccent = accent || colors.accent || colors.primary

  return (
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
  )
}



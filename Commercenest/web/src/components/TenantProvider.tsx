import { resolveTenantIdFromRequest, resolveTenantKeyFromId } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { getTenantConfig } from '@/tenants'
import TenantContextProvider from './TenantContextProvider'

export default async function TenantProvider({ 
  children, 
  tenantKey 
}: { 
  children: React.ReactNode
  tenantKey?: string 
}) {
  // Resolve tenant key/id with safe fallbacks
  let finalTenantKey: string
  let tenantId: string | undefined

  if (tenantKey) {
    finalTenantKey = tenantKey
    tenantId = undefined
  } else {
    const resolvedTenantId = await resolveTenantIdFromRequest()
    const resolvedTenantKey = resolvedTenantId ? await resolveTenantKeyFromId(resolvedTenantId) : null
    finalTenantKey = resolvedTenantKey ?? 'default'
    tenantId = resolvedTenantId ?? undefined
  }
  
  let accent: string | undefined
  
  let gstRatePercent: number | undefined
  if (tenantId) {
    const { data: settings } = await supabaseAdmin
      .from('settings_company_profile')
      .select('brand_accent_hex, gst_rate_percent')
      .eq('tenant_id', tenantId)
      .maybeSingle()
    accent = settings?.brand_accent_hex || undefined
    if (typeof settings?.gst_rate_percent === 'number') {
      gstRatePercent = settings.gst_rate_percent
    } else if (typeof settings?.gst_rate_percent === 'string') {
      const parsed = Number(settings.gst_rate_percent)
      gstRatePercent = Number.isFinite(parsed) ? parsed : undefined
    }
  }
  
  const cfg = getTenantConfig(finalTenantKey)
  const colors = cfg.theme.colors
  const brandAccent = accent || colors.accent || colors.primary
  // Prefer DB configuration for GST if available
  const pricing = {
    ...cfg.pricing,
    ...(typeof gstRatePercent === 'number' ? { gstRatePercent } : {})
  }

  return (
    <TenantContextProvider config={{ ...cfg, pricing }}>
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



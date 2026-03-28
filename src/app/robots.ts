import type { MetadataRoute } from 'next'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) {
    return { rules: [{ userAgent: '*', allow: '/' }] }
  }
  const { data } = await supabaseAdmin
    .from('tenant_domains')
    .select('hostname')
    .eq('tenant_id', tenantId)
    .eq('is_primary', true)
    .maybeSingle()
  const host = data?.hostname
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: host ? `https://${host}/sitemap.xml` : undefined,
  }
}



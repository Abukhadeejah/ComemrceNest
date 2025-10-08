import type { MetadataRoute } from 'next'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return []
  const base = await supabaseAdmin
    .from('tenant_domains')
    .select('hostname')
    .eq('tenant_id', tenantId)
    .eq('is_primary', true)
    .maybeSingle()
  const host = base.data?.hostname
  if (!host) return []
  const baseUrl = `https://${host}`
  // Minimal set — can expand with product/project slugs later
  return [
    { url: `${baseUrl}/`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/portfolio`, changeFrequency: 'weekly', priority: 0.6 },
  ]
}



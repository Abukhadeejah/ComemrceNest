import type { Metadata, Viewport } from 'next'
import { fetchCompanyProfileByTenantId } from '@/server/settings'
import { resolveTenantIdFromRequest, getPrimaryHostnameForTenant, getRequestHostname } from '@/server/tenant'
import { getTenantConfig } from '@/tenants'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { defaultSections } from '@/components/sections'

export default async function HomePage() {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Welcome</h1>
        <p className="text-sm text-neutral-600">No tenant resolved.</p>
      </main>
    )
  }
  return (
    <main className="p-0 space-y-6">
      {/* Sections per tenant config */}
      {await (async () => {
        const { data: domain } = await supabaseAdmin
          .from('tenant_domains').select('hostname').eq('tenant_id', tenantId).eq('is_primary', true).maybeSingle()
        const tenantKey = domain?.hostname?.split('.')[0] || 'default'
        const cfg = getTenantConfig(tenantKey)
        const comps = await Promise.all(cfg.homepage.sections.map(async (key) => {
          const C = defaultSections[key]
          if (!C) return null
          // Render server component
          // @ts-expect-error Server Component
          return <C key={key} />
        }))
        return comps
      })()}
    </main>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const tenantId = await resolveTenantIdFromRequest()
  const reqHost = await getRequestHostname()
  if (!tenantId) return { title: 'CommerceNest', metadataBase: reqHost ? new URL(`http://${reqHost}`) : undefined, alternates: { canonical: '/' } }
  const { data } = await fetchCompanyProfileByTenantId(tenantId)
  const host = await getPrimaryHostnameForTenant(tenantId)
  return {
    title: data?.name ? `${data.name} — Products` : 'Products',
    metadataBase: (host || reqHost) ? new URL(`${host ? 'https' : 'http'}://${host || reqHost}`) : undefined,
    alternates: { canonical: '/' },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return { themeColor: '#C9A227' }
  const { data } = await fetchCompanyProfileByTenantId(tenantId)
  return { themeColor: data?.brand_accent_hex ?? '#C9A227' }
}



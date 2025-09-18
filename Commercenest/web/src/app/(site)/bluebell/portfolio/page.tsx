import type { Metadata, Viewport } from 'next'
import { fetchCompanyProfileByTenantId } from '@/server/settings'
import { resolveTenantIdFromRequest, getPrimaryHostnameForTenant, getRequestHostname, getTenantConfig } from '@/server/tenant'
import { fetchPublishedProjects } from '@/server/modules/portfolio/service'
import { TenantPortfolio } from '@/components/tenant/TenantPortfolio'
import { adaptProjects } from '@/utils/typeAdapters'

export default async function BluebellPortfolioPage() {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Portfolio</h1>
        <p className="text-sm text-neutral-600">No tenant resolved.</p>
      </main>
    )
  }
  
  const { data: projects } = await fetchPublishedProjects(tenantId)
  const tenantConfig = await getTenantConfig(tenantId)
  const basePath = '/bluebell'
  
  if (!tenantConfig) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Portfolio</h1>
        <p className="text-sm text-neutral-600">Tenant configuration not found.</p>
      </main>
    )
  }

  const uiProjects = adaptProjects(projects || []).map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    hero_image_url: p.hero_image_url ?? undefined,
    description: p.description,
    location: p.location,
    featured: undefined
  }))

  return <TenantPortfolio projects={uiProjects} tenantConfig={tenantConfig} basePath={basePath} />
}

export async function generateMetadata(): Promise<Metadata> {
  const tenantId = await resolveTenantIdFromRequest()
  const reqHost = await getRequestHostname()
  
  if (!tenantId) {
    return {
      title: 'Portfolio',
      metadataBase: reqHost ? new URL(`http://${reqHost}`) : undefined,
      alternates: { canonical: '/portfolio' },
    }
  }
  
  const { data } = await fetchCompanyProfileByTenantId(tenantId)
  const host = await getPrimaryHostnameForTenant(tenantId)
  
  return {
    title: data?.name ? `${data.name} — Portfolio` : 'Portfolio',
    metadataBase: (host || reqHost) ? new URL(`${host ? 'https' : 'http'}://${host || reqHost}`) : undefined,
    alternates: { canonical: '/portfolio' },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return { themeColor: '#C9A227' }
  const { data } = await fetchCompanyProfileByTenantId(tenantId)
  return { themeColor: data?.brand_accent_hex ?? '#C9A227' }
}

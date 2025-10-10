import Image from 'next/image'
import type { Metadata, Viewport } from 'next'
import { fetchCompanyProfileByTenantId } from '@/server/settings'
import { resolveTenantIdFromRequest, getPrimaryHostnameForTenant, getRequestHostname } from '@/server/tenant'
import { BLUR_DATA_URL } from '@/lib/blurPlaceholder'
//
import { fetchPublishedProjects } from '@/server/modules/portfolio/service'

export default async function PortfolioPage() {
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
  return (
    <main className="p-6 space-y-4 brand-bg min-h-[60vh]">
      <h1 className="text-2xl font-semibold text-brand">Portfolio</h1>
      <ul className="space-y-2">
        {(projects ?? []).map((p) => (
          <li key={p.id} className="rounded border p-3 space-y-2 hover:border-brand transition">
            {p.hero_image_url ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded">
                <Image
                  src={p.hero_image_url}
                  alt={p.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                  priority={false}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
              </div>
            ) : null}
            <div className="font-medium">{p.title}</div>
          </li>
        ))}
      </ul>
    </main>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const tenantId = await resolveTenantIdFromRequest()
  const reqHost = await getRequestHostname()
  if (!tenantId) return { title: 'CommerceNest', metadataBase: reqHost ? new URL(`http://${reqHost}`) : undefined, alternates: { canonical: '/portfolio' } }
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



import type { Metadata, Viewport } from 'next'
import { fetchCompanyProfileByTenantId } from '@/server/settings'
import { revalidateTag } from 'next/cache'
import { tenantProductsTag } from '@/server/cacheTags'
import { resolveTenantIdFromRequest, getPrimaryHostnameForTenant, getRequestHostname } from '@/server/tenant'
import { fetchPublishedProducts } from '@/server/modules/products/service'
import { ProductCard } from '@/modules/products/components/ProductCard'
import Hero from '@/components/Hero'

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
  const { data: products } = await fetchPublishedProducts(tenantId)
  return (
    <main className="p-0 space-y-6">
      {/* @ts-expect-error Server Component */}
      <Hero />
      <div className="p-6">
      <h1 className="text-xl font-semibold">Products</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {(products ?? []).map((p) => (
          <ProductCard key={p.id} name={p.name} priceCents={p.price_cents} currency={p.currency} imageUrl={p.hero_image_url} />
        ))}
      </div>
      </div>
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



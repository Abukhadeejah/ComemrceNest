import type { Metadata, Viewport } from 'next'
import { fetchCompanyProfileByTenantId } from '@/server/settings'
import { revalidateTag } from 'next/cache'
import { tenantProductsTag } from '@/server/cacheTags'
import { resolveTenantIdFromRequest, getPrimaryHostnameForTenant, getRequestHostname } from '@/server/tenant'
import { fetchPublishedProductsPaged } from '@/server/modules/products/service'
import { ProductCard } from '@/modules/products/components/ProductCard'
import Hero from '@/components/Hero'

export default async function HomePage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Welcome</h1>
        <p className="text-sm text-neutral-600">No tenant resolved.</p>
      </main>
    )
  }
  const sp = (await searchParams) || {}
  const sort = (sp.sort as any) || 'updated_at'
  const dir = (sp.dir as any) || 'desc'
  const page = Number(sp.page || 1)
  const q = typeof sp.q === 'string' ? sp.q : undefined
  const { data: products, count } = await fetchPublishedProductsPaged(tenantId, { sort, dir, page, pageSize: 12, q })
  return (
    <main className="p-0 space-y-6">
      {/* @ts-expect-error Server Component */}
      <Hero />
      <div className="p-6">
      <h1 className="text-xl font-semibold">Products</h1>
      <form className="mt-3 flex flex-wrap items-center gap-2">
        <input className="w-56 rounded border px-3 py-2" type="search" name="q" defaultValue={q} placeholder="Search products" />
        <select className="rounded border px-2 py-2" name="sort" defaultValue={sort}>
          <option value="updated_at">Recently updated</option>
          <option value="price_cents">Price</option>
          <option value="name">Name</option>
        </select>
        <select className="rounded border px-2 py-2" name="dir" defaultValue={dir}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
        <button className="btn-brand rounded px-3 py-2">Apply</button>
      </form>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {(products ?? []).map((p) => (
          <a key={p.id} href={`/products/${p.slug}`} className="block">
            <ProductCard name={p.name} priceCents={p.price_cents} currency={p.currency} imageUrl={p.hero_image_url} />
          </a>
        ))}
      </div>
      {(count ?? 0) > 12 ? (
        <nav className="mt-4 flex items-center gap-2">
          {Array.from({ length: Math.ceil((count ?? 0) / 12) }).map((_, i) => {
            const p = i + 1
            const is = p === page
            const qs = new URLSearchParams({ ...(q ? { q } : {} as any), sort, dir, page: String(p) }).toString()
            return <a key={p} href={`/?${qs}`} className={`rounded border px-3 py-1 text-sm ${is ? 'bg-brand text-white border-brand' : ''}`}>{p}</a>
          })}
        </nav>
      ) : null}
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



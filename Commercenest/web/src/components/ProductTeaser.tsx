import Link from 'next/link'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchPublishedProductsPaged } from '@/server/modules/products/service'
import { ProductCard } from '@/modules/products/components/ProductCard'

export default async function ProductTeaser() {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return null
  const { data } = await fetchPublishedProductsPaged(tenantId, { page: 1, pageSize: 6, dir: 'desc', sort: 'updated_at' })
  const items = data ?? []
  if (items.length === 0) return null
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-primary">Featured Products</h2>
        <Link className="text-sm underline" href="/">View all</Link>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <Link key={p.id} href={`/products/${p.slug}`} className="block">
            <ProductCard name={p.name} priceCents={p.price_cents} currency={p.currency} imageUrl={p.hero_image_url} />
          </Link>
        ))}
      </div>
    </section>
  )
}



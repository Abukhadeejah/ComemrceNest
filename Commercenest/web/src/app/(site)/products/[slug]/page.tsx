import Image from 'next/image'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchProductBySlug } from '@/server/modules/products/service'

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return <main className="p-6">Unknown tenant</main>
  const { slug } = await params
  const { data: p } = await fetchProductBySlug(tenantId, slug)
  if (!p) return <main className="p-6">Product not found</main>
  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded border">
          {p.hero_image_url ? (
            <Image src={p.hero_image_url} alt={p.name} fill className="object-cover" />
          ) : null}
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">{p.name}</h1>
          <div className="text-lg">{p.currency} {(p.price_cents/100).toFixed(2)}</div>
          {p.description ? <p className="text-neutral-700 whitespace-pre-wrap">{p.description}</p> : null}
          <div className="pt-2">
            <button className="btn-brand rounded px-4 py-2">Add to cart</button>
          </div>
        </div>
      </div>
    </main>
  )
}



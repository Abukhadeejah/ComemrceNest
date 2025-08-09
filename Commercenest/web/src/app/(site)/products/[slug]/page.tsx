import Image from 'next/image'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchProductBySlug, fetchProductImages } from '@/server/modules/products/service'

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return <main className="p-6">Unknown tenant</main>
  const { slug } = await params
  const { data: product } = await fetchProductBySlug(tenantId, slug)
  if (!product) return <main className="p-6">Product not found</main>
  const { data: images } = await fetchProductImages(tenantId, product.id)

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded border">
            {product.hero_image_url ? (
              <Image src={product.hero_image_url} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="h-full w-full bg-neutral-100" />
            )}
          </div>
          {images && images.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded border">
                  <Image src={img.url} alt={img.alt ?? product.name} fill className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <div className="text-lg">{product.currency} {(product.price_cents/100).toFixed(2)}</div>
          {product.description ? <p className="text-neutral-700 whitespace-pre-wrap">{product.description}</p> : null}
          <div className="pt-2">
            <button className="btn-primary rounded px-4 py-2">Add to cart</button>
          </div>
        </div>
      </div>
    </main>
  )
}



import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchProductBySlug, fetchProductImages } from '@/server/modules/products/service'
import PdpClient from './PdpClient'

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return <main className="p-6">Unknown tenant</main>
  const { slug } = await params
  const { data: product } = await fetchProductBySlug(tenantId, slug)
  if (!product) return <main className="p-6">Product not found</main>
  const { data: images } = await fetchProductImages(tenantId, product.id)

  return <PdpClient name={product.name} description={product.description} hero_image_url={product.hero_image_url ?? undefined} images={(images ?? []).map(i => ({ id: i.id, url: i.url, alt: i.alt }))} price_cents={product.price_cents} />
}



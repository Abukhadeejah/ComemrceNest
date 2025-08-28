import { notFound } from 'next/navigation'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchProductBySlug, fetchProductImages } from '@/server/modules/products/service'
import PdpClient from '@/app/(site)/products/[slug]/PdpClient'

interface BluebellProductPageProps {
  params: Promise<{ slug: string }>
}

export default async function BluebellProductPage({ params }: BluebellProductPageProps) {
  const { slug } = await params
  
  // Resolve tenant dynamically (guardrails: avoid hardcoding tenant IDs)
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) {
    notFound()
  }
  
  const { data: product, error } = await fetchProductBySlug(tenantId, slug)
  
  if (error || !product) {
    notFound()
  }

  const { data: images } = await fetchProductImages(tenantId, product.id)

  return (
    <PdpClient
      productId={product.id}
      name={product.name}
      description={product.description}
      hero_image_url={product.hero_image_url}
      images={images || []}
      price_cents={product.price_cents}
      tenantKey="bluebell"
    />
  )
}

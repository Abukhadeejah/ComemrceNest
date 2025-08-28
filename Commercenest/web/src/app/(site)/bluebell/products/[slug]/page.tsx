import { notFound } from 'next/navigation'
import { fetchProductBySlug, fetchProductImages } from '@/server/modules/products/service'
import PdpClient from '@/app/(site)/products/[slug]/PdpClient'

interface BluebellProductPageProps {
  params: Promise<{ slug: string }>
}

export default async function BluebellProductPage({ params }: BluebellProductPageProps) {
  const { slug } = await params
  
  // Bluebell tenant ID (hardcoded for now, should be resolved from context)
  const tenantId = '11111111-1111-4111-8111-11111111bb01'
  
  const { data: product, error } = await fetchProductBySlug(tenantId, slug)
  
  if (error || !product) {
    notFound()
  }

  const { data: images } = await fetchProductImages(tenantId, product.id)

  return (
    <PdpClient
      name={product.name}
      description={product.description}
      hero_image_url={product.hero_image_url}
      images={images || []}
      price_cents={product.price_cents}
      tenantKey="bluebell"
    />
  )
}

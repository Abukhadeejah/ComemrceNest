import type { Metadata } from 'next'
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

export async function generateMetadata({ params }: BluebellProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return {}
  const { data: product } = await fetchProductBySlug(tenantId, slug)
  if (!product) return {}
  const title = product.meta_title || `${product.name} | Bluebell Interiors`
  const description = product.meta_description || (product.description ? product.description.slice(0, 160) : 'Premium interior fabric by Bluebell Interiors')
  const images = product.hero_image_url ? [product.hero_image_url] : []
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    }
  }
}

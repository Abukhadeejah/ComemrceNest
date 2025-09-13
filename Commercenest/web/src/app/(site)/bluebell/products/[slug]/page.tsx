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

  const images = await fetchProductImages(tenantId, product.id)

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
  if (!tenantId) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.'
    }
  }

  const { data: product } = await fetchProductBySlug(tenantId, slug)

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.'
    }
  }

  return {
    title: `${product.name} | Bluebell Interiors`,
    description: product.description || `Shop ${product.name} at Bluebell Interiors - Premium fabrics and design materials.`,
    openGraph: {
      title: `${product.name} | Bluebell Interiors`,
      description: product.description || `Shop ${product.name} at Bluebell Interiors - Premium fabrics and design materials.`,
      images: product.hero_image_url ? [{ url: product.hero_image_url, alt: product.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Bluebell Interiors`,
      description: product.description || `Shop ${product.name} at Bluebell Interiors - Premium fabrics and design materials.`,
      images: product.hero_image_url ? [product.hero_image_url] : [],
    },
  }
}
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchProductBySlug, fetchProductImages } from '@/server/modules/products/service'
import { ProductDetail } from '@/components/tenant/products/ProductDetail'
import { Product } from '@/types/product'

interface SenlyshProductPageProps {
  params: Promise<{ slug: string }>
}

export default async function SenlyshProductPage({ params }: SenlyshProductPageProps) {
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
    <ProductDetail
      product={product as unknown as Parameters<typeof ProductDetail>[0]['product']}
      images={images || []}
    />
  )
}

export async function generateMetadata({ params }: SenlyshProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return {}
  const { data: product } = await fetchProductBySlug(tenantId, slug)
  if (!product) return {}
  const title = product.meta_title || `${product.name} | Senlysh Fashion`
  const description = product.meta_description || (product.description ? product.description.slice(0, 160) : 'Premium fashion by Senlysh')
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



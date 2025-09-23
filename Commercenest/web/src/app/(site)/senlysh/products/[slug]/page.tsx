import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchProductBySlug, fetchProductImages, fetchProductVariantOptions, fetchProductVariants } from '@/server/modules/products/service'
import { ProductDetail } from '@/components/tenant/products/ProductDetail'

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
  const variantOptionsRaw = await fetchProductVariantOptions(tenantId, product.id)
  const variantCombinations = await fetchProductVariants(tenantId, product.id)
  
  const variantOptions = (variantOptionsRaw || []).map(item => ({
    variant_options: {
      id: item.variant_options.id,
      name: item.variant_options.name,
      display_name: item.variant_options.display_name,
      type: item.variant_options.type,
      variant_option_values: (item.variant_options.variant_option_values || []).map(v => ({
        id: v.id,
        value: v.value,
        display_value: v.display_value,
        color_hex: v.color_hex,
        image_url: v.image_url,
        sort_order: v.sort_order,
        price_adjustment_cents: v.price_adjustment_cents,
        cost_adjustment_cents: v.cost_adjustment_cents
      }))
    }
  }))

  console.log('[SenlyshProductPage] Product:', product.name, 'ID:', product.id)
  console.log('[SenlyshProductPage] Images count:', images?.length || 0)
  console.log('[SenlyshProductPage] Variant options count:', variantOptions?.length || 0)
  console.log('[SenlyshProductPage] Variant combinations count:', variantCombinations?.length || 0)

  return (
    <ProductDetail
      product={product as unknown as Parameters<typeof ProductDetail>[0]['product']}
      images={images || []}
      variantOptions={variantOptions}
      variantCombinations={variantCombinations?.map(vc => ({
        id: vc.id,
        name: vc.name,
        price_cents: vc.price_cents,
        stock: vc.stock || 0,
        sku: vc.sku || '',
        attributes: vc.attributes as Record<string, string>
      }))}
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



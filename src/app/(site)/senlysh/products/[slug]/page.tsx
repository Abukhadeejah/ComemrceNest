import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchProductBySlug, fetchProductImages, fetchProductVariantOptions, fetchProductVariants, fetchProductAttributes } from '@/server/modules/products/service'
import { ProductDetail } from '@/components/tenant/products/ProductDetail'

interface SenlyshProductPageProps {
  params: Promise<{ slug: string }>
}

export default async function SenlyshProductPage({ params }: SenlyshProductPageProps) {
  const { slug } = await params

  // Resolve tenant dynamically
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
  const productAttributes = await fetchProductAttributes(tenantId, product.id)
  
  // FIXED: Match ProductDetail exact interface naming
  const variantOptions = (variantOptionsRaw || []).map(item => ({
    variantoptions: {
      id: item.variant_options.id,
      name: item.variant_options.name,
      displayname: item.variant_options.display_name,  // Changed to 'displayname'
      type: item.variant_options.type,
      variantoptionvalues: (item.variant_options.variant_option_values || []).map(v => ({  // Changed to 'variantoptionvalues'
        id: v.id,
        value: v.value,
        displayvalue: v.display_value,  // Changed to 'displayvalue'
        colorhex: v.color_hex,  // Changed to 'colorhex'
        imageurl: v.image_url,  // Changed to 'imageurl'
        sortorder: v.sort_order,  // Changed to 'sortorder'
        priceadjustmentcents: v.price_adjustment_cents,  // Changed to 'priceadjustmentcents'
        costadjustmentcents: v.cost_adjustment_cents  // Changed to 'costadjustmentcents'
      }))
    }
  }))

  console.log('[SenlyshProductPage] Product:', product.name, 'ID:', product.id)
  console.log('[SenlyshProductPage] Images count:', images?.length || 0)
  console.log('[SenlyshProductPage] Variant options count:', variantOptions?.length || 0)
  console.log('[SenlyshProductPage] Variant combinations count:', variantCombinations?.length || 0)

  return (
    <ProductDetail
      product={{
        id: product.id,
        name: product.name,
        pricecents: product.price_cents,  // Transform price_cents to pricecents
        currency: product.currency,
        compare_at_price_cents: product.compare_at_price_cents,
        productsizeguides: product.product_size_guides?.map(psg => ({
          sizeguides: {
            id: psg.size_guides.id,
            name: psg.size_guides.name,
            category: psg.size_guides.category,
            gender: psg.size_guides.gender,
            measurements: psg.size_guides.measurements
          }
        }))
      } as Parameters<typeof ProductDetail>[0]['product']}
      images={images || []}
      variantOptions={variantOptions}
      variantCombinations={variantCombinations?.map(vc => ({
        id: vc.id,
        name: vc.name,
        pricecents: vc.price_cents,  // Changed to 'pricecents'
        stock: vc.stock || 0,
        sku: vc.sku || '',
        attributes: vc.attributes as Record<string, string>
      }))}
      attributes={productAttributes}
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

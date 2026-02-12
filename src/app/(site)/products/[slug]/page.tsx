import { notFound } from 'next/navigation'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchProductBySlug, fetchProductImages, fetchProductAttributes, fetchProductVariantOptions, fetchProductVariants, fetchRandomProducts } from '@/server/modules/products/service'
import { ProductDetail } from '@/components/tenant/products/ProductDetail'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    return <div>Tenant not found</div>
  }

  const { data: product, error } = await fetchProductBySlug(tenantId, slug)
  
  if (error || !product) {
    notFound()
  }

  const images = await fetchProductImages(tenantId, product.id)
  const productAttributes = await fetchProductAttributes(tenantId, product.id)
  const variantOptionsRaw = await fetchProductVariantOptions(tenantId, product.id)
  const variantCombinationsRaw = await fetchProductVariants(tenantId, product.id)
  const relatedProducts = await fetchRandomProducts(tenantId, product.id, 4)

  // Transform variant options to match ProductDetail interface
  const variantOptions = (variantOptionsRaw || []).map(item => ({
    variantoptions: {
      id: item.variant_options.id,
      name: item.variant_options.name,
      displayname: item.variant_options.display_name,
      type: item.variant_options.type,
      variantoptionvalues: (item.variant_options.variant_option_values || []).map(v => ({
        id: v.id,
        value: v.value,
        displayvalue: v.display_value,
        colorhex: v.color_hex,
        imageurl: v.image_url,
        sortorder: v.sort_order,
        priceadjustmentcents: v.price_adjustment_cents,
        costadjustmentcents: v.cost_adjustment_cents
      }))
    }
  }))

  // Transform variant combinations to match ProductDetail interface
  const variantCombinations = (variantCombinationsRaw || []).map(vc => ({
    id: vc.id,
    name: vc.name,
    pricecents: vc.price_cents,
    stock: vc.stock || 0,
    sku: vc.sku || '',
    attributes: vc.attributes as Record<string, string>
  }))

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetail 
          product={{
            id: product.id,
            name: product.name,
            pricecents: product.price_cents,
            currency: product.currency,
            compare_at_price_cents: product.compare_at_price_cents,
            hero_image_url: product.hero_image_url,
            description: product.description,
            size_guide_type: product.size_guide_type,
            product_size_guides: product.product_size_guides
          } as Parameters<typeof ProductDetail>[0]['product']} 
          images={images || []} 
          attributes={productAttributes}
          variantOptions={variantOptions}
          variantCombinations={variantCombinations}
          relatedProducts={relatedProducts}
        />
      </div>
    </div>
  )
}



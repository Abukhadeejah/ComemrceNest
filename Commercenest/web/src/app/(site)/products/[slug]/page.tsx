import { notFound } from 'next/navigation'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchProductBySlug, fetchProductImages } from '@/server/modules/products/service'
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

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetail product={product as Product & { product_size_guides?: any[] }} images={images || []} />
      </div>
    </div>
  )
}



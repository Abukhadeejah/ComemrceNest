import { notFound } from 'next/navigation'
import { resolveTenantIdFromKey } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline'

interface ProductViewPageProps {
  params: Promise<{ id: string; tenant: string }>
}

interface ProductImage {
  url: string
  alt?: string
  sort_order: number
}

export default async function ProductViewPage({ params }: ProductViewPageProps) {
  const { id, tenant } = await params
  
  try {
    // Resolve tenant ID from the tenant key in the URL params
    const tenantId = await resolveTenantIdFromKey(tenant)
    
    if (!tenantId) {
      console.log('No tenant ID found for tenant key:', tenant)
      notFound()
    }

    console.log('Tenant ID:', tenantId)
    console.log('Product ID:', id)

    // Get product with category and images
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories:product_categories(
          category:categories(name, slug)
        ),
        images:product_images(
          url,
          alt,
          sort_order
        )
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      console.log('Database error:', error)
      notFound()
    }

    if (!product) {
      console.log('No product found')
      notFound()
    }

    console.log('Product found:', product.name)

    const formatPrice = (priceCents: number) => {
      return `₹${(priceCents / 100).toFixed(2)}`
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-IN')
    }

    const getStatusBadge = (status: string) => {
      const statusConfig = {
        draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
        published: { label: 'Published', className: 'bg-green-100 text-green-800' }
      }
      
      const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
          {config.label}
        </span>
      )
    }

    const categoryName = product.categories?.[0]?.category?.name || 'No category'
    const sortedImages = product.images?.sort((a, b) => a.sort_order - b.sort_order) || []

    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                href={`/${tenant}/admin/products`}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-gray-500">Product Details</p>
              </div>
            </div>
            <Link
              href={`/${tenant}/admin/products/${product.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PencilIcon className="-ml-1 mr-2 h-4 w-4" />
              Edit Product
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Images */}
              {sortedImages.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {sortedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={image.url}
                          alt={image.alt || `Product image ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Hero
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Description */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                <div className="prose max-w-none">
                  {product.description ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
                  ) : (
                    <p className="text-gray-500 italic">No description provided</p>
                  )}
                </div>
              </div>

              {/* Product Details */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Product Details</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">SKU</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.sku || 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="mt-1 text-sm text-gray-900">{categoryName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">{getStatusBadge(product.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(product.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(product.updated_at)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Selling Price</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-900">
                      {formatPrice(product.price_cents)}
                    </dd>
                  </div>
                  {product.cost_per_item_cents && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Cost Price</dt>
                      <dd className="mt-1 text-lg text-gray-900">
                        {formatPrice(product.cost_per_item_cents)}
                      </dd>
                    </div>
                  )}
                  {product.cost_per_item_cents && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Profit Margin</dt>
                      <dd className="mt-1 text-lg text-green-600 font-medium">
                        {((product.price_cents - product.cost_per_item_cents) / product.price_cents * 100).toFixed(1)}%
                      </dd>
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory</h3>
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stock Quantity</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-900">
                      {product.stock || 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Track Inventory</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.track_inventory 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.track_inventory ? 'Yes' : 'No'}
                      </span>
                    </dd>
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">SEO</h3>
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Slug</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{product.slug}</dd>
                  </div>
                  {product.meta_title && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Meta Title</dt>
                      <dd className="mt-1 text-sm text-gray-900">{product.meta_title}</dd>
                    </div>
                  )}
                  {product.meta_description && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Meta Description</dt>
                      <dd className="mt-1 text-sm text-gray-900">{product.meta_description}</dd>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading product:', error)
    notFound()
  }
}



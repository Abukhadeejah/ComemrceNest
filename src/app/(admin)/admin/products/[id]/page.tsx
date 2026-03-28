import { notFound } from 'next/navigation'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import Link from 'next/link'
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline'

interface ProductViewPageProps {
  params: Promise<{ id: string }>
}

interface ProductImage {
  url: string
  alt?: string
  sort_order: number
}



export default async function ProductViewPage({ params }: ProductViewPageProps) {
  const { id } = await params
  
  try {
    const tenantId = await resolveTenantIdFromRequest()
    
    if (!tenantId) {
      console.log('No tenant ID found')
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
                href="/admin/products"
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
              href={`/admin/products/${product.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PencilIcon className="-ml-1 mr-2 h-4 w-4" />
              Edit Product
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">{product.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Slug</dt>
                    <dd className="text-sm text-gray-900">{product.slug}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="text-sm text-gray-900">{product.description || 'No description'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="text-sm text-gray-900">{categoryName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">{getStatusBadge(product.status)}</dd>
                  </div>
                </dl>
              </div>

              {/* Pricing */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
                {(() => {
                  const mrp = product.compare_at_price_cents
                  const sale = product.price_cents
                  const hasSale = !!sale && sale > 0 && !!mrp && mrp > sale
                  const selling = hasSale ? sale : (mrp ?? sale)

                  return (
                    <dl className="grid grid-cols-1 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Selling Price</dt>
                        <dd className="text-sm text-gray-900">{formatPrice(selling)}</dd>
                      </div>

                      {hasSale && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Sale Price (Discounted)</dt>
                          <dd className="text-sm text-gray-900">{formatPrice(sale)}</dd>
                        </div>
                      )}

                      {mrp && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">MRP</dt>
                          <dd className={`text-sm text-gray-900 ${hasSale ? 'line-through text-gray-500' : ''}`}>
                            {formatPrice(mrp)}
                          </dd>
                        </div>
                      )}

                      {product.cost_per_item_cents && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Cost per Item</dt>
                          <dd className="text-sm text-gray-900">{formatPrice(product.cost_per_item_cents)}</dd>
                        </div>
                      )}
                    </dl>
                  )
                })()}
              </div>

              {/* Inventory */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory</h3>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stock</dt>
                    <dd className="text-sm text-gray-900">{product.stock}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">SKU</dt>
                    <dd className="text-sm text-gray-900">{product.sku || 'No SKU'}</dd>
                  </div>
                  {product.track_inventory && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Low Stock Threshold</dt>
                      <dd className="text-sm text-gray-900">{product.low_stock_threshold || 'Not set'}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Allow Backorders</dt>
                    <dd className="text-sm text-gray-900">{product.allow_backorders ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </div>

              {/* Shipping */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping</h3>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Requires Shipping</dt>
                    <dd className="text-sm text-gray-900">{product.requires_shipping ? 'Yes' : 'No'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Taxable</dt>
                    <dd className="text-sm text-gray-900">{product.taxable ? 'Yes' : 'No'}</dd>
                  </div>
                  {product.weight && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Weight</dt>
                      <dd className="text-sm text-gray-900">{product.weight} kg</dd>
                    </div>
                  )}
                  {product.dimensions && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Dimensions</dt>
                      <dd className="text-sm text-gray-900">{product.dimensions}</dd>
                    </div>
                  )}
                  {product.hs_code && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">HS Code</dt>
                      <dd className="text-sm text-gray-900">{product.hs_code}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Images */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Images</h3>
                {sortedImages.length > 0 ? (
                  <div className="space-y-3">
                    {sortedImages.map((image, index) => (
                      <div key={index} className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={image.alt || `Product image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            Hero
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No images uploaded</p>
                )}
              </div>

              {/* Metadata */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
                <dl className="grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">{formatDate(product.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="text-sm text-gray-900">{formatDate(product.updated_at)}</dd>
                  </div>
                  {product.meta_title && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Meta Title</dt>
                      <dd className="text-sm text-gray-900">{product.meta_title}</dd>
                    </div>
                  )}
                  {product.meta_description && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Meta Description</dt>
                      <dd className="text-sm text-gray-900">{product.meta_description}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.log('Error in ProductViewPage:', error)
    notFound()
  }
}

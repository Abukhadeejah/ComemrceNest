import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { assertTenantAdmin } from '@/server/auth'
import { revalidateTag } from 'next/cache'
import { tenantProductsTag } from '@/server/cacheTags'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { PlusIcon } from '@heroicons/react/24/outline'

export default async function AdminProducts() {
  const tenantId = await resolveTenantIdFromRequest()
  const { data: products } = tenantId
    ? await supabaseAdmin
        .from('products')
        .select('id, name, slug, status, price_cents, currency, stock')
        .eq('tenant_id', tenantId)
        .order('updated_at', { ascending: false })
    : { data: [] as Array<{ id: string; name: string; slug: string; status: string; price_cents: number; currency: string; stock: number }>} 

  return (
    <AdminLayout 
      title="Products"
      breadcrumbs={[
        { label: 'Dashboard', href: '/admin' },
        { label: 'Products' }
      ]}
    >
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Products</h2>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2">
              <PlusIcon className="h-5 w-5" />
              Add Product
            </button>
          </div>
        </div>

        {/* Create Product Form */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <form action={createProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input 
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" 
              name="name" 
              placeholder="Product Name" 
              required 
            />
            <input 
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" 
              name="slug" 
              placeholder="Product Slug" 
              required 
            />
            <input 
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" 
              name="price_cents" 
              placeholder="Price (₹)" 
              type="number" 
              required 
            />
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
              Create Product
            </button>
          </form>
        </div>

        {/* Products List */}
        <div className="divide-y divide-gray-200">
          {(products ?? []).map((p) => (
            <div key={p.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium text-gray-900">{p.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      p.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {p.slug} • ₹{p.price_cents/100} • Stock: {p.stock}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <form action={publishProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-sm text-indigo-600 hover:text-indigo-900 font-medium">
                      {p.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                  </form>
                  
                  <form action={uploadProductImage} encType="multipart/form-data" className="flex items-center gap-2">
                    <input type="hidden" name="product_id" value={p.id} />
                    <input 
                      className="text-sm border border-gray-300 rounded px-2 py-1" 
                      type="file" 
                      name="file" 
                      accept="image/*" 
                      required 
                    />
                    <button className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700">
                      Upload Image
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!products || products.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found. Create your first product to get started.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

async function createProduct(formData: FormData) {
  'use server'
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return
  await assertTenantAdmin(tenantId)
  const name = String(formData.get('name') || '')
  const slug = String(formData.get('slug') || '')
  const price_cents = Number(formData.get('price_cents') || 0)
  await supabaseAdmin.from('products').insert({ tenant_id: tenantId, name, slug, price_cents, currency: 'INR', status: 'draft', stock: 0 })
  revalidateTag(tenantProductsTag(tenantId))
}

async function publishProduct(formData: FormData) {
  'use server'
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return
  await assertTenantAdmin(tenantId)
  const id = String(formData.get('id') || '')
  await supabaseAdmin.from('products').update({ status: 'published' }).eq('id', id).eq('tenant_id', tenantId)
  revalidateTag(tenantProductsTag(tenantId))
}

async function uploadProductImage(formData: FormData) {
  'use server'
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return
  await assertTenantAdmin(tenantId)
  const productId = String(formData.get('product_id') || '')
  const file = formData.get('file') as unknown as File | null
  if (!file) return
  const fileAny = file as unknown as { name?: string; type?: string }
  const keySafeName = fileAny.name?.toString?.() || 'image'
  const objectPath = `${tenantId}/${productId}/${Date.now()}_${keySafeName}`
  const upload = await supabaseAdmin.storage.from('product-images').upload(objectPath, file as File, { upsert: true, contentType: fileAny.type || 'image/jpeg' })
  if (upload.error) return
  const { data } = supabaseAdmin.storage.from('product-images').getPublicUrl(objectPath)
  const url = data.publicUrl
  await supabaseAdmin.from('product_images').insert({ tenant_id: tenantId as unknown as string, product_id: productId as unknown as string, url, alt: keySafeName, sort_order: 0 })
  // Set hero image if not present
  await supabaseAdmin.from('products').update({ hero_image_url: url }).eq('id', productId).eq('tenant_id', tenantId).is('hero_image_url', null)
  revalidateTag(tenantProductsTag(tenantId))
}



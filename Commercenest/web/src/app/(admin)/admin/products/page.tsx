import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { assertTenantAdmin } from '@/server/auth'
import { revalidateTag } from 'next/cache'
import { tenantProductsTag } from '@/server/cacheTags'

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
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Products</h1>
      <form action={createProduct} className="flex gap-2">
        <input className="border px-2 py-1" name="name" placeholder="Name" required />
        <input className="border px-2 py-1" name="slug" placeholder="slug" required />
        <input className="border px-2 py-1" name="price_cents" placeholder="price (cents)" type="number" required />
        <button className="border px-3 py-1 rounded">Create</button>
      </form>
      <ul className="space-y-2">
        {(products ?? []).map((p) => (
          <li key={p.id} className="rounded border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-neutral-600">{p.slug} · {p.status} · {p.currency} {p.price_cents/100}</div>
              </div>
              <form action={publishProduct}>
                <input type="hidden" name="id" value={p.id} />
                <button className="text-sm underline">Publish</button>
              </form>
            </div>
            <form action={uploadProductImage} encType="multipart/form-data" className="flex items-center gap-2">
              <input type="hidden" name="product_id" value={p.id} />
              <input className="text-sm" type="file" name="file" accept="image/*" required />
              <button className="border px-2 py-1 rounded text-sm">Upload Image</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
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



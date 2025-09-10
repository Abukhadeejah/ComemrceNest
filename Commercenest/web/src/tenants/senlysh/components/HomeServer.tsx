import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchPublishedProducts } from '@/server/modules/products/service'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import Home from './Home'

interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string
  image_url?: string
  image_alt?: string
}

export default async function HomeServer() {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) {
    return <main className="p-6"><h1 className="text-xl font-semibold">Senlysh</h1><p className="text-sm text-neutral-600">Tenant not found.</p></main>
  }

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select('id, name, slug, description, price_cents, compare_at_price_cents, stock, currency, hero_image_url, images, status')
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .order('updated_at', { ascending: false }),
    supabaseAdmin
      .from('categories')
      .select('id, name, slug, parent_id, image_url, image_alt')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })
  ])

  return <Home products={products || []} categories={categories || []} />
}

import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { fetchPublishedProductsWithVariants } from '@/server/modules/products/service'
import Home from './Home'
import { adaptHeroSlides, adaptHeroSettings, adaptCategories } from '@/utils/typeAdapters'

// interface _Category {
//   id: string
//   name: string
//   slug: string
//   parent_id?: string
//   image_url?: string
//   image_alt?: string
// }

export default async function HomeServer() {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) {
    return <main className="p-6"><h1 className="text-xl font-semibold">Senlysh</h1><p className="text-sm text-neutral-600">Tenant not found.</p></main>
  }

  const [productsResult, { data: categories }, { data: heroSlides }, { data: heroSettings }, { data: variantCombinations }] = await Promise.all([
    fetchPublishedProductsWithVariants(tenantId),
    supabaseAdmin
      .from('categories')
      .select('id, name, slug, parent_id, image_url, image_alt')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true }),
    supabaseAdmin
      .from('hero_slides')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('position', { ascending: true }),
    supabaseAdmin
      .from('hero_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single(),
    supabaseAdmin
      .from('product_variants')
      .select('product_id, id, name, price_cents, stock, sku, attributes')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
  ])

  return <Home 
    products={(productsResult.data || []).map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description ?? undefined,
      price_cents: p.price_cents,
      compare_at_price_cents: p.compare_at_price_cents ?? undefined,
      currency: p.currency,
      hero_image_url: p.hero_image_url ?? undefined,
      images: undefined,
      stock: p.stock,
      status: p.status,
      is_featured: p.is_featured ?? undefined,
      is_bestseller: p.is_bestseller ?? undefined,
      is_on_sale: p.is_on_sale ?? undefined,
      is_new_arrival: p.is_new_arrival ?? undefined,
      product_variant_options: p.product_variant_options ?? undefined
    }))} 
    categories={adaptCategories(categories || [])} 
    heroSlides={adaptHeroSlides(heroSlides || [])}
    heroSettings={heroSettings ? adaptHeroSettings(heroSettings) : null}
    variantCombinations={(variantCombinations || []).map(vc => ({
      product_id: vc.product_id,
      id: vc.id,
      name: vc.name,
      price_cents: vc.price_cents,
      stock: vc.stock || 0,
      sku: vc.sku || '',
      attributes: vc.attributes as Record<string, string>
    }))}
  />
}

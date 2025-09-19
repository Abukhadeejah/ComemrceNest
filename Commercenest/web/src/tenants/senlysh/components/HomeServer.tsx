import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
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

  const [{ data: products }, { data: categories }, { data: heroSlides }, { data: heroSettings }] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select(`
        id, name, slug, description, price_cents, compare_at_price_cents, stock, currency, hero_image_url, status, 
        is_featured, is_bestseller, is_on_sale, is_new_arrival,
        product_variant_options(
          variant_options(
            id, name, display_name, type,
            variant_option_values(
              id, value, display_value, color_hex, image_url, 
              price_adjustment_cents, cost_adjustment_cents, sort_order
            )
          )
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('status', 'published')
      .order('updated_at', { ascending: false }),
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
      .single()
  ])

  return <Home 
    products={(products || []).map(p => ({
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
  />
}

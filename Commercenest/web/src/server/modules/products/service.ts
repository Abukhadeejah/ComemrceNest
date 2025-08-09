 
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function fetchPublishedProducts(tenantId: string) {
  return supabaseAdmin
    .from('products')
    .select('id, name, slug, price_cents, currency, hero_image_url')
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
}

export type ProductListParams = {
  sort?: 'updated_at' | 'price_cents' | 'name'
  dir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
  q?: string
  minPriceCents?: number
  maxPriceCents?: number
}

export async function fetchPublishedProductsPaged(
  tenantId: string,
  { sort = 'updated_at', dir = 'desc', page = 1, pageSize = 12, q, minPriceCents, maxPriceCents }: ProductListParams
) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  let query = supabaseAdmin
    .from('products')
    .select('id, name, slug, price_cents, currency, hero_image_url', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
  if (q && q.trim()) {
    query = query.ilike('name', `%${q.trim()}%`)
  }
  if (typeof minPriceCents === 'number' && !Number.isNaN(minPriceCents)) {
    query = query.gte('price_cents', minPriceCents)
  }
  if (typeof maxPriceCents === 'number' && !Number.isNaN(maxPriceCents)) {
    query = query.lte('price_cents', maxPriceCents)
  }
  const { data, count, error } = await query.order(sort, { ascending: dir === 'asc' }).range(from, to)
  return { data, count, error }
}

export async function fetchProductBySlug(tenantId: string, slug: string) {
  return supabaseAdmin
    .from('products')
    .select('id, name, slug, description, price_cents, currency, hero_image_url')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .maybeSingle()
}

export async function fetchProductImages(tenantId: string, productId: string) {
  return supabaseAdmin
    .from('product_images')
    .select('id, url, alt, sort_order')
    .eq('tenant_id', tenantId)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
}



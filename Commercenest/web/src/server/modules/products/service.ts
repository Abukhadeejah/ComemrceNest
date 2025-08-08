 
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
}

export async function fetchPublishedProductsPaged(
  tenantId: string,
  { sort = 'updated_at', dir = 'desc', page = 1, pageSize = 12, q }: ProductListParams
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



 
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function fetchPublishedProducts(tenantId: string) {
  return supabaseAdmin
    .from('products')
    .select('id, name, slug, price_cents, compare_at_price_cents, stock, currency, hero_image_url')
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
}

export type ProductListItem = {
  id: string
  name: string
  slug: string
  price_cents: number
  compare_at_price_cents?: number | null
  currency: string
  hero_image_url: string | null
  stock: number
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
  params: ProductListParams & { categoryId?: string }
) {
  const { sort = 'updated_at', dir = 'desc', page = 1, pageSize = 12, q, minPriceCents, maxPriceCents, categoryId } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  let selectCols = 'id, name, slug, price_cents, compare_at_price_cents, stock, currency, hero_image_url'
  if (categoryId) {
    selectCols += ', product_categories!inner(category_id)'
  }
  let query = supabaseAdmin
    .from('products')
    .select(selectCols, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('status', 'published')
  if (categoryId) {
    query = query.eq('product_categories.category_id', categoryId)
  }
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
    .select('id, name, slug, description, price_cents, currency, hero_image_url, meta_title, meta_description')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .maybeSingle()
}

export async function fetchProductImages(tenantId: string, productId: string) {
  const { data, error } = await supabaseAdmin
    .from('product_images')
    .select('id, url, alt, sort_order')
    .eq('tenant_id', tenantId)
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (error || !data) {
    // On error, fail gracefully with an empty array – the caller can decide what to show.
    console.error('[fetchProductImages] query error', error)
    return []
  }

  // Helper to fix single-slash protocol and trim.
  const sanitizeUrl = (raw?: string | null): string => {
    if (!raw) return ''
    return raw
      .trim()
      .replace(/^(https?:)\/(?!\/)/, '$1//')
      .replace(/\/+$/, '')
  }

  const urlRegex = /https?:\/\/[^\s'"\]\)]+/g
  const transformed: Array<{ id: string; url: string; alt?: string | null; sort_order: number }> = []

  for (const row of data) {
    if (row.url && (row.url.includes('[') || row.url.includes('%22') || row.url.includes('"'))) {
      // Corrupted JSON-like blob – pull every URL out.
      const matches = (row.url.match(urlRegex) ?? []) as string[]
      if (matches.length) {
        matches.forEach((u: string, idx: number) => {
          const clean = sanitizeUrl(u)
          if (clean) {
            transformed.push({
              id: `${row.id}-${idx}`,
              url: clean,
              alt: row.alt,
              sort_order: (row.sort_order || 0) + idx,
            })
          }
        })
        continue
      }
      // If no usable url found, fall through to push sanitized original.
    }

    const clean = sanitizeUrl(row.url)
    if (clean) {
      transformed.push({
        id: row.id,
        url: clean,
        alt: row.alt,
        sort_order: row.sort_order,
      })
    }
  }

  // Ensure consistent ordering after expansion
  transformed.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  return transformed
}



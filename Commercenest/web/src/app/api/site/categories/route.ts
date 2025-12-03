import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'

export async function GET(request: Request) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const withCounts = searchParams.get('with_counts') === 'true'

    if (withCounts) {
      // Get categories with product counts
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select(`
          id, name, slug, parent_id, image_url, image_alt,
          product_categories(count)
        `)
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Transform to include counts
      const categoriesWithCounts = (data ?? []).map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parent_id: cat.parent_id,
        image_url: cat.image_url,
        image_alt: cat.image_alt,
        count: Array.isArray(cat.product_categories) ? cat.product_categories.length : 0
      }))

      return NextResponse.json({ categories: categoriesWithCounts })
    } else {
      // Original query without counts
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('id, name, slug, parent_id, image_url, image_alt')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ categories: data ?? [] })
    }
  } catch (error) {
    console.error('[Categories API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}



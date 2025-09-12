import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'

export async function GET(_request: NextRequest) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Fetch all unique tags from products for this tenant
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('tags')
      .eq('tenant_id', tenantId)
      .not('tags', 'is', null)
      .eq('status', 'published')

    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    // Extract unique tags from all products
    const allTags = products?.flatMap(product => product.tags || []) || []
    const uniqueTags = Array.from(new Set(allTags)).sort()

    return NextResponse.json({ 
      tags: uniqueTags,
      count: uniqueTags.length 
    })

  } catch (error) {
    console.error('Error in tags API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

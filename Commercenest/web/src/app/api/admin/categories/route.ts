import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { assertTenantAdmin } from '@/server/auth'
import { resolveTenantIdFromRequest } from '@/server/tenant'

export async function POST(request: NextRequest) {
  try {
    const { name, slug, tenantId: tenantIdFromBody } = await request.json()

    if (!name || !slug) {
      return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
    }

    const resolvedTenantId = tenantIdFromBody || await resolveTenantIdFromRequest()
    const tenantId = resolvedTenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    await assertTenantAdmin(tenantId)

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({ tenant_id: tenantId, name, slug })
      .select('id, name, slug, created_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, name, slug, tenantId: tenantIdFromBody } = await request.json()

    if (!id || !name || !slug) {
      return NextResponse.json({ error: 'id, name and slug are required' }, { status: 400 })
    }

    const resolvedTenantId = tenantIdFromBody || await resolveTenantIdFromRequest()
    const tenantId = resolvedTenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    await assertTenantAdmin(tenantId)

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update({ name, slug })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('id, name, slug, created_at')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}



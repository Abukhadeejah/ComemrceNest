import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { assertTenantAdminApi, TenantAdminAuthError } from '@/server/auth'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function GET(_req: NextRequest, context: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await context.params
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 401 })
    await assertTenantAdminApi(tenantId)

    const { data, error } = await supabaseAdmin
      .from('product_drafts')
      .select('data')
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data?.data || null)
  } catch (error) {
    if (error instanceof TenantAdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await context.params
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 401 })
    await assertTenantAdminApi(tenantId)

    const payload = await req.json()

    const { error } = await supabaseAdmin
      .from('product_drafts')
      .upsert({
        tenant_id: tenantId,
        product_id: productId,
        data: payload,
      } as any, { onConflict: 'tenant_id,product_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof TenantAdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await context.params
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 401 })
    await assertTenantAdminApi(tenantId)

    const { error } = await supabaseAdmin
      .from('product_drafts')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof TenantAdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 })
  }
}
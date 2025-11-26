import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { assertTenantAdmin, getAuthenticatedUserId } from '@/server/auth'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function GET(_req: NextRequest, context: { params: Promise<{ productId: string }> }) {
  const { productId } = await context.params
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 401 })
  await assertTenantAdmin(tenantId)

  const { data, error } = await supabaseAdmin
    .from('product_drafts')
    .select('draft_data')
    .eq('tenant_id', tenantId)
    .eq('product_id', productId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.draft_data || null)
}

export async function PUT(req: NextRequest, context: { params: Promise<{ productId: string }> }) {
  const { productId } = await context.params
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 401 })
  await assertTenantAdmin(tenantId)

  const payload = await req.json()
  const userId = await getAuthenticatedUserId()

  const { error } = await supabaseAdmin
    .from('product_drafts')
    .upsert({
      tenant_id: tenantId,
      product_id: productId,
      draft_data: payload,
      created_by: userId || null
    } as any, { onConflict: 'tenant_id,product_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ productId: string }> }) {
  const { productId } = await context.params
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 401 })
  await assertTenantAdmin(tenantId)

  const { error } = await supabaseAdmin
    .from('product_drafts')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('product_id', productId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}



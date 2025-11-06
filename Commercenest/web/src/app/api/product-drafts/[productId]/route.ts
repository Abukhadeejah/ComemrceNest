import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { assertTenantAdmin } from '@/server/auth'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function GET(_req: NextRequest, { params }: { params: { productId: string } }) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 401 })
  await assertTenantAdmin(tenantId)

  const { data, error } = await supabaseAdmin
    .from('product_drafts')
    .select('data')
    .eq('tenant_id', tenantId)
    .eq('product_id', params.productId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data?.data || null)
}

export async function PUT(req: NextRequest, { params }: { params: { productId: string } }) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 401 })
  await assertTenantAdmin(tenantId)

  const payload = await req.json()
  const { error } = await supabaseAdmin
    .from('product_drafts')
    .upsert({
      tenant_id: tenantId,
      product_id: params.productId,
      data: payload
    }, { onConflict: 'tenant_id,product_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { productId: string } }) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return NextResponse.json({ error: 'Tenant not found' }, { status: 401 })
  await assertTenantAdmin(tenantId)

  const { error } = await supabaseAdmin
    .from('product_drafts')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('product_id', params.productId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}



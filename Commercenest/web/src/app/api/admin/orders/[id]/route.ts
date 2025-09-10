import { NextResponse } from 'next/server'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { assertTenantAdmin } from '@/server/auth'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { revalidateTag } from 'next/cache'
import { tenantProductsTag } from '@/server/cacheTags'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return NextResponse.json({ error: 'tenant_not_found' }, { status: 400 })
  await assertTenantAdmin(tenantId)

  const { error } = await supabaseAdmin
    .from('orders')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  
  // Invalidate cache after successful deletion
  revalidateTag(tenantProductsTag(tenantId))
  
  return NextResponse.json({ ok: true })
}



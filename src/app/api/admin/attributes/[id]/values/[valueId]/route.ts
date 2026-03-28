import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'

interface RouteParams {
  params: Promise<{ id: string; valueId: string }>
}

// DELETE /api/admin/attributes/[id]/values/[valueId]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: attributeId, valueId } = await params
    const tenantId = await resolveTenantIdFromRequest()

    if (!attributeId || typeof attributeId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid attribute ID' },
        { status: 400 }
      )
    }

    if (!valueId || typeof valueId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid value ID' },
        { status: 400 }
      )
    }

    // Verify the attribute belongs to this tenant
    const { data: attribute, error: attrError } = await supabaseAdmin
      .from('attributes')
      .select('id')
      .eq('id', attributeId)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (attrError || !attribute) {
      return NextResponse.json(
        { error: 'Attribute not found' },
        { status: 404 }
      )
    }

    // Verify the value belongs to this attribute and tenant
    const { data: value, error: valueError } = await supabaseAdmin
      .from('attribute_values')
      .select('id')
      .eq('id', valueId)
      .eq('attribute_id', attributeId)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (valueError || !value) {
      return NextResponse.json(
        { error: 'Value not found' },
        { status: 404 }
      )
    }

    // Delete the value
    const { error } = await supabaseAdmin
      .from('attribute_values')
      .delete()
      .eq('id', valueId)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('DELETE /api/admin/attributes/[id]/values/[valueId] error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: unknown) {
    console.error('DELETE /api/admin/attributes/[id]/values/[valueId] unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

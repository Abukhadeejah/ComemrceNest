import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { resolveTenantIdFromRequest } from '@/server/tenant'

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE /api/admin/attributes/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: attributeId } = await params
    const tenantId = await resolveTenantIdFromRequest()

    if (!attributeId || typeof attributeId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid attribute ID' },
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

    // Delete all values for this attribute first (cascade delete)
    const { error: valuesError } = await supabaseAdmin
      .from('attribute_values')
      .delete()
      .eq('attribute_id', attributeId)
      .eq('tenant_id', tenantId)

    if (valuesError) {
      console.error('Failed to delete attribute values:', valuesError)
      return NextResponse.json(
        { error: 'Failed to delete attribute values' },
        { status: 500 }
      )
    }

    // Delete the attribute itself
    const { error } = await supabaseAdmin
      .from('attributes')
      .delete()
      .eq('id', attributeId)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('DELETE /api/admin/attributes/[id] error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: unknown) {
    console.error('DELETE /api/admin/attributes/[id] unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

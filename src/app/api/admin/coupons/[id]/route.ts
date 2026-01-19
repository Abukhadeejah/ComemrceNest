import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseAdmin
    const { id } = params
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { is_active } = body

    // Update coupon
    const { data: coupon, error } = await supabase
      .from('coupons')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating coupon:', error)
      return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
    }

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error('Error in PATCH /api/admin/coupons/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseAdmin
    const { id } = params
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete coupon
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting coupon:', error)
      return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/coupons/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

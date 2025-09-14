import { NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/server/auth'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return NextResponse.json({ error: 'no tenant context' }, { status: 400 })
    }

    // Check if user has access to this tenant
    const { data: member, error } = await supabaseAdmin
      .from('tenant_members')
      .select('role')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (error) {
      console.error('Database error checking tenant access:', error)
      return NextResponse.json({ error: 'database error' }, { status: 500 })
    }

    if (!member) {
      return NextResponse.json({ error: 'unauthorized for this tenant' }, { status: 403 })
    }

    return NextResponse.json({ 
      userId, 
      tenantId, 
      role: member.role,
      authorized: true 
    })
  } catch (error) {
    console.error('Error checking tenant access:', error)
    return NextResponse.json({ error: 'internal server error' }, { status: 500 })
  }
}

































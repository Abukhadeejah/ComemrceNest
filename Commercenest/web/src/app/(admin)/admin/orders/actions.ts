import { resolveTenantIdFromRequest } from '@/server/tenant'
import { assertTenantAdmin } from '@/server/auth'
import { supabaseAdmin } from '@/server/supabaseAdmin'

export async function getOrders(searchParams: {
  search?: string
  status?: string
  page?: string
}) {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) { throw new Error('Tenant not found') }
    await assertTenantAdmin(tenantId)

    const page = parseInt(searchParams.page || '1')
    const pageSize = 20
    const offset = (page - 1) * pageSize

    let query = supabaseAdmin
      .from('orders')
      .select('id, order_number, email, total_cents, currency, status, created_at', { count: 'exact' })
      .eq('tenant_id', tenantId)

    // Apply search filter
    if (searchParams.search) {
      query = query.or(`order_number.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%`)
    }

    // Apply status filter
    if (searchParams.status && searchParams.status !== 'all') {
      query = query.eq('status', searchParams.status)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`)
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    }
  } catch (error) {
    console.error('getOrders error:', error)
    throw error
  }
}





































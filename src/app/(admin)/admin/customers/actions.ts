import { resolveTenantIdFromRequest } from '@/server/tenant'
import { assertTenantAdmin } from '@/server/auth'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import type { AdminCustomerList } from '@/types/customer'

export async function getCustomers(searchParams: {
  search?: string
  status?: string
  page?: string
}): Promise<AdminCustomerList> {
  try {
    const tenantId = await resolveTenantIdFromRequest()
    if (!tenantId) {
      return { data: [], count: 0, page: 1, pageSize: 20, totalPages: 0 }
    }
    try {
      await assertTenantAdmin(tenantId)
    } catch {
      // Graceful empty state in prod when not logged in as tenant admin
      return { data: [], count: 0, page: 1, pageSize: 20, totalPages: 0 }
    }

    const page = parseInt(searchParams.page || '1')
    const pageSize = 20
    const offset = (page - 1) * pageSize

    // Get unique customers from orders table
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('email, total_cents, created_at, status')
      .eq('tenant_id', tenantId)

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`)
    }

    // Group orders by email to get customer data
    const customerMap = new Map()
    orders?.forEach(order => {
      const email = order.email
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          id: email, // Use email as ID since we don't have a customers table
          email: email,
          first_name: email.split('@')[0], // Extract name from email
          last_name: '',
          phone: '',
          created_at: order.created_at,
          total_orders: 0,
          total_spent_cents: 0
        })
      }
      
      const customer = customerMap.get(email)
      customer.total_orders += 1
      if (order.status === 'paid') {
        customer.total_spent_cents += order.total_cents
      }
    })

    const customers = Array.from(customerMap.values())
    
    // Apply search filter
    let filteredCustomers = customers
    if (searchParams.search) {
      const searchTerm = searchParams.search.toLowerCase()
      filteredCustomers = customers.filter(customer => 
        customer.email.toLowerCase().includes(searchTerm) ||
        customer.first_name.toLowerCase().includes(searchTerm) ||
        customer.last_name.toLowerCase().includes(searchTerm)
      )
    }

    // Apply pagination
    const totalCount = filteredCustomers.length
    const startIndex = offset
    const endIndex = offset + pageSize
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex)



    // Sort by most recent order
    paginatedCustomers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return {
      data: paginatedCustomers,
      count: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    }
  } catch (error) {
    console.error('getCustomers error:', error)
    // Fallback to non-breaking empty dataset
    return { data: [], count: 0, page: 1, pageSize: 20, totalPages: 0 }
  }
}

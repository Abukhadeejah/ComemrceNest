import { Suspense } from 'react'
import { getCustomers } from './actions'
import { CustomerTable } from './CustomerTable'
import { CustomerFilters } from './CustomerFilters'

interface CustomersPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    page?: string
  }>
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams
  // Gate route by module
  const { resolveTenantIdFromRequest } = await import('@/server/tenant')
  const { isModuleEnabled } = await import('@/server/adminModules')
  const tenantId = await resolveTenantIdFromRequest()
  const allowed = tenantId ? await isModuleEnabled(tenantId, 'customers') : false
  if (!allowed) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-semibold">Module unavailable</h1>
        <p className="text-sm text-neutral-600">This module is not enabled for your plan. Contact support to upgrade.</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-600">Manage your customer database</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            title="Export CSV (coming soon)"
            disabled
          >
            Export CSV
          </button>
        </div>
      </div>

      <Suspense fallback={<div className="p-6 text-sm text-gray-600">Loading customers...</div>}>
        <CustomersContent params={params} />
      </Suspense>
    </div>
  )
}

async function CustomersContent({ params }: { params: { search?: string; status?: string; page?: string } }) {
  try {
    const customers = await getCustomers(params)
    
    return (
      <div className="space-y-4">
        <CustomerFilters 
          currentStatus={params.status}
          currentSearch={params.search}
        />
        <CustomerTable customers={customers} />
      </div>
    )
  } catch (error) {
    console.error('Error loading customers:', error)
    return (
      <div className="text-center py-12">
        <div className="text-red-600">Failed to load customers</div>
        <div className="text-sm text-gray-500 mt-2">Please try again later</div>
      </div>
    )
  }
}

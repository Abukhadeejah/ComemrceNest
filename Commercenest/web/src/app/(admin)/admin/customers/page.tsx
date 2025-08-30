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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-600">Manage your customer database</p>
        </div>
      </div>

      <Suspense fallback={<div>Loading customers...</div>}>
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

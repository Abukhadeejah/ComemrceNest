import { Suspense } from 'react'
import { getTaxClasses } from '@/app/(admin)/admin/tax-classes/actions'
import { TaxClassTable } from '@/app/(admin)/admin/tax-classes/TaxClassTable'
import { CreateTaxClassButton } from '@/app/(admin)/admin/tax-classes/CreateTaxClassButton'

export default async function TenantTaxClassesPage() {
  try {
    const taxClasses = await getTaxClasses()

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tax Classes</h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure tax rates for different types of products
            </p>
          </div>
          <CreateTaxClassButton />
        </div>

        <div className="bg-white shadow rounded-lg">
          <Suspense fallback={<div className="p-6">Loading tax classes...</div>}>
            <TaxClassTable taxClasses={taxClasses} />
          </Suspense>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Indian GST Rates Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <strong>0% GST:</strong> Books, newspapers, essential medicines
            </div>
            <div>
              <strong>5% GST:</strong> Food items, medicines, textiles (cotton)
            </div>
            <div>
              <strong>12% GST:</strong> Computers, mobile phones, furniture
            </div>
            <div>
              <strong>18% GST:</strong> Most goods and services (default)
            </div>
            <div>
              <strong>28% GST:</strong> Luxury items, automobiles, tobacco
            </div>
            <div>
              <strong>3% GST:</strong> Gold, silver, precious stones
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Tax Classes Error:', error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Tax Classes</h2>
          <p className="text-red-700 mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    )
  }
}

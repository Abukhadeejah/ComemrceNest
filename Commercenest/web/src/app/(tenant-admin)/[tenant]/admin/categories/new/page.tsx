import { resolveTenantIdFromRequest } from '../../../../../../server/tenant'
import { CategoryForm } from '../../../../../(admin)/admin/categories/CategoryForm'
import { notFound } from 'next/navigation'

export default async function NewCategoryPage() {
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    notFound()
  }
  
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Create New Category</h2>
            <p className="text-gray-600 mt-1">
              Add a new category to organize your products
            </p>
          </div>
          
          <CategoryForm 
            mode="create"
            tenantId={tenantId}
          />
        </div>
      </div>
    </div>
  )
}

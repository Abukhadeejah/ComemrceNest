import { resolveTenantIdFromRequest } from '../../../../../../server/tenant'
import { CategoryForm } from '../../../../../(admin)/admin/categories/CategoryForm'
import { getCategories } from '../../../../../(admin)/admin/products/actions'
import { notFound } from 'next/navigation'

export default async function NewCategoryPage() {
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    notFound()
  }
  const categories = await getCategories(tenantId)
  
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
            allCategories={categories.map(c => ({ 
              id: c.id, 
              name: c.name,
              slug: c.slug,
              parent_id: (c as Record<string, unknown>).parent_id as string | null || null,
              created_at: c.created_at
            }))}
          />
        </div>
      </div>
    </div>
  )
}

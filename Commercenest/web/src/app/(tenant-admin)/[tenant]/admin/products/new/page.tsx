import { resolveTenantIdFromRequest } from '../../../../../../server/tenant'
import { supabaseAdmin } from '../../../../../../server/supabaseAdmin'
import { ProductForm } from '../../../../../(admin)/admin/products/ProductForm'

export default async function NewProductPage() {
  const tenantId = await resolveTenantIdFromRequest()
  
  // Get categories for the form
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug')
    .eq('tenant_id', tenantId)
    .order('name')

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Create New Product</h2>
            <p className="text-gray-600 mt-1">
              Add a new product to your catalog
            </p>
          </div>
          
          <ProductForm 
            categories={categories || []}
            mode="create"
          />
        </div>
      </div>
    </div>
  )
}







































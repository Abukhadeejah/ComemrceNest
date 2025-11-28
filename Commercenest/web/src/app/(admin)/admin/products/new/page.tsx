import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { ProductForm } from '../ProductForm'

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ draftId?: string }>
}) {
  const tenantId = await resolveTenantIdFromRequest()
  
  if (!tenantId) {
    throw new Error('Tenant not found')
  }
  
  // Get categories for the form
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug')
    .eq('tenant_id', tenantId)
    .order('name')

  // Load draft data if draftId is provided
  const params = await searchParams
  let draftData = {}
  if (params.draftId) {
    const { data: draft } = await supabaseAdmin
      .from('product_drafts')
      .select('draft_data')
      .eq('id', params.draftId)
      .eq('tenant_id', tenantId)
      .maybeSingle()
    
    if (draft?.draft_data) {
      draftData = draft.draft_data as Record<string, unknown>
      console.log('📦 Loaded draft data:', draftData)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {params.draftId ? 'Continue Draft' : 'Create New Product'}
            </h2>
            <p className="text-gray-600 mt-1">
              {params.draftId ? 'Continue editing your draft product' : 'Add a new product to your catalog'}
            </p>
          </div>
          
          <ProductForm 
            categories={(categories || []).map(c => ({ 
              id: c.id as string, 
              name: c.name as string,
              slug: (c as Record<string, unknown>).slug as string || '',
              parent_id: (c as Record<string, unknown>).parent_id as string | null || null,
              created_at: (c as Record<string, unknown>).created_at as string || new Date().toISOString()
            }))}
            mode="create"
            tenantId={tenantId}
            initialData={draftData}
          />
        </div>
      </div>
    </div>
  )
}

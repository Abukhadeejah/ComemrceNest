import { notFound } from 'next/navigation'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { CategoryForm } from '@/app/(admin)/admin/categories/CategoryForm'

interface EditProps { params: Promise<{ id: string; tenant?: string }> }

export default async function EditCategoryPage({ params }: EditProps) {
  const p = await params
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) notFound()

  const [{ data: cat }, { data: list }] = await Promise.all([
    supabaseAdmin
      .from('categories')
      .select('id,name,slug,parent_id')
      .eq('id', p.id)
      .eq('tenant_id', tenantId)
      .maybeSingle(),
    supabaseAdmin
      .from('categories')
      .select('id,name')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })
  ])

  if (!cat) notFound()

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Edit Category</h2>
          </div>
          <CategoryForm
            mode="edit"
            tenantId={tenantId}
            allCategories={(list || []).map(c => ({ 
              id: c.id as string, 
              name: c.name as string,
              slug: (c as Record<string, unknown>).slug as string || '',
              parent_id: (c as Record<string, unknown>).parent_id as string | null || null,
              created_at: (c as Record<string, unknown>).created_at as string || new Date().toISOString()
            }))}
            initialData={{ id: cat.id as string, name: cat.name as string, slug: cat.slug as string, parentId: (cat as { parent_id?: string | null }).parent_id ?? null }}
          />
        </div>
      </div>
    </div>
  )
}



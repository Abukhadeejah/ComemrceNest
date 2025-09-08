import { notFound } from 'next/navigation'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import Link from 'next/link'
import { resolveTenantKeyFromId } from '@/server/tenant'

interface ViewProps { params: Promise<{ id: string; tenant?: string }> }

export default async function ViewCategoryPage({ params }: ViewProps) {
  const p = await params
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) notFound()
  const tenantKey = await resolveTenantKeyFromId(tenantId)

  const [{ data: cat }, { data: list }] = await Promise.all([
    supabaseAdmin
      .from('categories')
      .select('id,name,slug,parent_id,image_url,image_alt,created_at')
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

  const parentName = (list || []).find(c => c.id === (cat as { parent_id?: string | null }).parent_id)?.name || null

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Category Details</h2>
            <Link href={`/${tenantKey}/admin/categories/${cat.id as string}/edit`} className="px-3 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700">
              Edit
            </Link>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-6">
              <div>
                { (cat as { image_url?: string | null }).image_url ? (
                  <img
                    src={(cat as { image_url?: string | null }).image_url as string}
                    alt={(cat as { image_alt?: string | null }).image_alt || (cat.name as string)}
                    className="h-24 w-24 rounded object-cover border"
                  />
                ) : (
                  <div className="h-24 w-24 rounded bg-gray-100 border flex items-center justify-center text-gray-400 text-xs">IMG</div>
                )}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-500">Name</div>
                  <div className="text-base font-medium text-gray-900">{cat.name as string}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Slug</div>
                  <div className="text-base text-gray-900">{cat.slug as string}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Parent</div>
                  <div className="text-base text-gray-900">{parentName || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="text-base text-gray-900">{new Date(cat.created_at as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { assertTenantAdmin } from '@/server/auth'
import { revalidateTag } from 'next/cache'
import { tenantPortfolioTag } from '@/server/cacheTags'

type AdminProject = {
  id: string
  title: string
  slug: string
  status: string
  featured: boolean
  description: string | null
  location: string | null
}

export default async function AdminPortfolio() {
  const tenantId = await resolveTenantIdFromRequest()
  // Gate route by module
  const { isModuleEnabled } = await import('@/server/adminModules')
  const allowed = tenantId ? await isModuleEnabled(tenantId, 'portfolio') : false
  if (!allowed) {
    return (
      <main className="p-6">
        <h1 className="text-lg font-semibold">Module unavailable</h1>
        <p className="text-sm text-neutral-600">This module is not enabled for your plan. Contact support to upgrade.</p>
      </main>
    )
  }
  const { data } = tenantId
    ? await supabaseAdmin
        .from('portfolio_projects')
        .select('id, title, slug, status, featured, description, location')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
    : { data: [] as AdminProject[] }

  const projects: AdminProject[] = (data ?? []) as AdminProject[]

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Portfolio</h1>
      <form action={createProject} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <label className="text-sm text-gray-700">
          <span className="block mb-1">Title</span>
          <input className="border px-2 py-1 w-full rounded" name="title" placeholder="e.g., Villa Renovation" required />
        </label>
        <label className="text-sm text-gray-700">
          <span className="block mb-1">Slug</span>
          <input className="border px-2 py-1 w-full rounded" name="slug" placeholder="villa-renovation" required />
        </label>
        <label className="text-sm text-gray-700">
          <span className="block mb-1">Location</span>
          <input className="border px-2 py-1 w-full rounded" name="location" placeholder="Mumbai, India" />
        </label>
        <label className="text-sm text-gray-700 lg:col-span-2">
          <span className="block mb-1">Short description</span>
          <input className="border px-2 py-1 w-full rounded" name="description" placeholder="One-line description for list view" />
        </label>
        <div>
          <button className="border px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-sm">Create</button>
        </div>
      </form>
      {projects.length === 0 && (
        <div className="bg-white border rounded-md p-6 text-center text-sm text-gray-600">
          No projects yet. Add your first portfolio project using the form above.
        </div>
      )}
      <ul className="space-y-2">
        {projects.map((p) => (
          <li key={p.id} className="rounded border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-neutral-600">{p.slug} · {p.status} {p.featured ? '· featured': ''}</div>
                {p.location ? <div className="text-xs text-neutral-700">{p.location}</div> : null}
                {p.description ? <div className="text-xs text-neutral-700 line-clamp-2">{p.description}</div> : null}
              </div>
              <form action={publishProject}>
                <input type="hidden" name="id" value={p.id} />
                <button className="text-sm underline">Publish</button>
              </form>
            </div>
            <form action={uploadProjectImage} encType="multipart/form-data" className="flex items-center gap-2">
              <input type="hidden" name="project_id" value={p.id} />
              <input className="text-sm" type="file" name="file" accept="image/*" required />
              <button className="border px-2 py-1 rounded text-sm">Upload Image</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  )
}

async function createProject(formData: FormData) {
  'use server'
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return
  await assertTenantAdmin(tenantId)
  const title = String(formData.get('title') || '')
  const slug = String(formData.get('slug') || '')
  const location = String(formData.get('location') || '')
  const description = String(formData.get('description') || '')
  await supabaseAdmin.from('portfolio_projects').insert({ tenant_id: tenantId, title, slug, status: 'draft', featured: false, location: location || null, description: description || null })
  revalidateTag(tenantPortfolioTag(tenantId))
}

async function publishProject(formData: FormData) {
  'use server'
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return
  await assertTenantAdmin(tenantId)
  const id = String(formData.get('id') || '')
  await supabaseAdmin.from('portfolio_projects').update({ status: 'published' }).eq('id', id).eq('tenant_id', tenantId)
  revalidateTag(tenantPortfolioTag(tenantId))
}

async function uploadProjectImage(formData: FormData) {
  'use server'
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return
  await assertTenantAdmin(tenantId)
  const projectId = String(formData.get('project_id') || '')
  const file = formData.get('file') as unknown as File | null
  if (!file) return
  const fileAny = file as unknown as { name?: string; type?: string }
  const keySafeName = fileAny.name?.toString?.() || 'image'
  const objectPath = `${tenantId}/${projectId}/${Date.now()}_${keySafeName}`
  const upload = await supabaseAdmin.storage.from('portfolio-images').upload(objectPath, file as File, { upsert: true, contentType: fileAny.type || 'image/jpeg' })
  if (upload.error) return
  const { data } = supabaseAdmin.storage.from('portfolio-images').getPublicUrl(objectPath)
  const url = data.publicUrl
  await supabaseAdmin.from('portfolio_images').insert({ tenant_id: tenantId as unknown as string, project_id: projectId as unknown as string, url, alt: keySafeName, sort_order: 0 })
  await supabaseAdmin.from('portfolio_projects').update({ hero_image_url: url }).eq('id', projectId).eq('tenant_id', tenantId).is('hero_image_url', null)
  revalidateTag(tenantPortfolioTag(tenantId))
}



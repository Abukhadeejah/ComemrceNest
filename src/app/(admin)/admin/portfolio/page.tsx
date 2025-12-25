import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { assertTenantAdmin } from '@/server/auth'
import { revalidateTag } from 'next/cache'
import { tenantPortfolioTag } from '@/server/cacheTags'
import { ModuleDisabled } from '@/components/admin/ModuleDisabled'
import { BriefcaseIcon } from '@heroicons/react/24/outline'

type AdminProject = {
  id: string
  title: string
  slug: string
  status: string
  featured: boolean
  description: string | null
  location: string | null
}

type AdminImage = {
  id: string
  url: string
  alt: string | null
  sort_order: number
}

export default async function AdminPortfolio() {
  const tenantId = await resolveTenantIdFromRequest()
  // Gate route by module
  const { isModuleEnabled } = await import('@/server/adminModules')
  const allowed = tenantId ? await isModuleEnabled(tenantId, 'portfolio') : false
  if (!allowed) {
    return (
      <ModuleDisabled
        moduleName="Portfolio"
        moduleDescription="Manage and showcase your portfolio projects with images, descriptions, and project details."
        moduleIcon={BriefcaseIcon}
      />
    )
  }
  const { data: projectsData } = tenantId
    ? await supabaseAdmin
        .from('portfolio_projects')
        .select('id, title, slug, status, featured, description, location')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
    : { data: [] as AdminProject[] }

  const projects: AdminProject[] = (projectsData ?? []) as AdminProject[]

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
      <ul className="space-y-4">
        {projects.map(async (p) => {
          const { data: imagesData } = await supabaseAdmin
            .from('portfolio_images')
            .select('id, url, alt, sort_order')
            .eq('project_id', p.id)
            .order('sort_order', { ascending: true })
          const images = (imagesData ?? []) as AdminImage[]
          return (
          <li key={p.id} className="rounded border p-3 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-neutral-600">{p.slug} · {p.status} {p.featured ? '· featured': ''}</div>
                {p.location ? <div className="text-xs text-neutral-700">{p.location}</div> : null}
                {p.description ? <div className="text-xs text-neutral-700 line-clamp-2">{p.description}</div> : null}
              </div>
              <div className="flex items-center gap-2">
                <form action={publishProject}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="text-sm underline">Publish</button>
                </form>
                <form action={deleteProject}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="text-sm text-red-600 underline" title="Delete project">Delete</button>
                </form>
              </div>
            </div>
            {/* Edit inline */}
            <form action={updateProject} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <input type="hidden" name="id" value={p.id} />
              <label className="text-sm text-gray-700">
                <span className="block mb-1">Title</span>
                <input className="border px-2 py-1 w-full rounded" name="title" defaultValue={p.title} />
              </label>
              <label className="text-sm text-gray-700">
                <span className="block mb-1">Slug</span>
                <input className="border px-2 py-1 w-full rounded" name="slug" defaultValue={p.slug} />
              </label>
              <label className="text-sm text-gray-700">
                <span className="block mb-1">Location</span>
                <input className="border px-2 py-1 w-full rounded" name="location" defaultValue={p.location ?? ''} />
              </label>
              <label className="text-sm text-gray-700 lg:col-span-2">
                <span className="block mb-1">Short description</span>
                <input className="border px-2 py-1 w-full rounded" name="description" defaultValue={p.description ?? ''} />
              </label>
              <div>
                <button className="border px-3 py-2 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm">Save</button>
              </div>
            </form>
            <form action={uploadProjectImage} encType="multipart/form-data" className="flex items-center gap-2">
              <input type="hidden" name="project_id" value={p.id} />
              <input className="text-sm" type="file" name="file" accept="image/*" required />
              <button className="border px-2 py-1 rounded text-sm">Upload Image</button>
            </form>
            {/* Images with reorder controls */}
            {images.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-neutral-600">Images (drag not yet supported; use Up/Down)</div>
                <ul className="space-y-1">
                  {images.map((img, idx) => (
                    <li key={img.id} className="flex items-center justify-between gap-3 border rounded p-2">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.alt ?? ''} className="h-10 w-10 object-cover rounded" />
                        <div className="text-xs text-neutral-700">#{img.sort_order}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <form action={reorderImage}>
                          <input type="hidden" name="project_id" value={p.id} />
                          <input type="hidden" name="image_id" value={img.id} />
                          <input type="hidden" name="direction" value="up" />
                          <button className="text-xs px-2 py-1 border rounded disabled:opacity-50" disabled={idx === 0}>Up</button>
                        </form>
                        <form action={reorderImage}>
                          <input type="hidden" name="project_id" value={p.id} />
                          <input type="hidden" name="image_id" value={img.id} />
                          <input type="hidden" name="direction" value="down" />
                          <button className="text-xs px-2 py-1 border rounded disabled:opacity-50" disabled={idx === images.length - 1}>Down</button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        )})}
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
  revalidateTag(tenantPortfolioTag(tenantId), 'default')
}

async function publishProject(formData: FormData) {
  'use server'
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return
  await assertTenantAdmin(tenantId)
  const id = String(formData.get('id') || '')
  await supabaseAdmin.from('portfolio_projects').update({ status: 'published' }).eq('id', id).eq('tenant_id', tenantId)
  revalidateTag(tenantPortfolioTag(tenantId), 'default')
}

async function updateProject(formData: FormData) {
  'use server'
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return
  await assertTenantAdmin(tenantId)
  const id = String(formData.get('id') || '')
  const title = String(formData.get('title') || '')
  const slug = String(formData.get('slug') || '')
  const location = String(formData.get('location') || '')
  const description = String(formData.get('description') || '')
  if (!id) return
  await supabaseAdmin
    .from('portfolio_projects')
    .update({ title, slug, location: location || null, description: description || null })
    .eq('id', id)
    .eq('tenant_id', tenantId)
  revalidateTag(tenantPortfolioTag(tenantId), 'default')
}

async function deleteProject(formData: FormData) {
  'use server'
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return
  await assertTenantAdmin(tenantId)
  const id = String(formData.get('id') || '')
  if (!id) return
  // Delete images first (safety), then project
  await supabaseAdmin.from('portfolio_images').delete().eq('tenant_id', tenantId as unknown as string).eq('project_id', id)
  await supabaseAdmin.from('portfolio_projects').delete().eq('tenant_id', tenantId).eq('id', id)
  revalidateTag(tenantPortfolioTag(tenantId), 'default')
}

async function reorderImage(formData: FormData) {
  'use server'
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return
  await assertTenantAdmin(tenantId)
  const projectId = String(formData.get('project_id') || '')
  const imageId = String(formData.get('image_id') || '')
  const direction = String(formData.get('direction') || 'up')
  if (!projectId || !imageId) return

  // Fetch images ordered
  const { data: imgs } = await supabaseAdmin
    .from('portfolio_images')
    .select('id, sort_order')
    .eq('tenant_id', tenantId as unknown as string)
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })

  const arr = imgs || []
  const idx = arr.findIndex(i => i.id === imageId)
  if (idx < 0) return
  const swapWith = direction === 'up' ? idx - 1 : idx + 1
  if (swapWith < 0 || swapWith >= arr.length) return

  const current = arr[idx]
  const other = arr[swapWith]

  // Swap sort_order values
  await supabaseAdmin.from('portfolio_images').update({ sort_order: other.sort_order }).eq('id', current.id)
  await supabaseAdmin.from('portfolio_images').update({ sort_order: current.sort_order }).eq('id', other.id)

  revalidateTag(tenantPortfolioTag(tenantId), 'default')
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
  revalidateTag(tenantPortfolioTag(tenantId), 'default')
}



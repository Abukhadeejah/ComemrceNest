import { resolveTenantIdFromRequest } from '@/server/tenant'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import { assertTenantAdmin } from '@/server/auth'
import { revalidateTag } from 'next/cache'
import { tenantPortfolioTag } from '@/server/cacheTags'

export default async function AdminPortfolio() {
  const tenantId = await resolveTenantIdFromRequest()
  const { data: projects } = tenantId
    ? await supabaseAdmin
        .from('portfolio_projects')
        .select('id, title, slug, status, featured')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Portfolio</h1>
      <form action={createProject} className="flex gap-2">
        <input className="border px-2 py-1" name="title" placeholder="Title" required />
        <input className="border px-2 py-1" name="slug" placeholder="slug" required />
        <button className="border px-3 py-1 rounded">Create</button>
      </form>
      <ul className="space-y-2">
        {(projects ?? []).map((p) => (
          <li key={p.id} className="rounded border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-neutral-600">{p.slug} · {p.status} {p.featured ? '· featured': ''}</div>
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
  await supabaseAdmin.from('portfolio_projects').insert({ tenant_id: tenantId, title, slug, status: 'draft', featured: false })
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
  const keySafeName = (file as any).name?.toString?.() || 'image'
  const objectPath = `${tenantId}/${projectId}/${Date.now()}_${keySafeName}`
  const upload = await supabaseAdmin.storage.from('portfolio-images').upload(objectPath, file as any, { upsert: true, contentType: (file as any).type || 'image/jpeg' })
  if (upload.error) return
  const { data } = supabaseAdmin.storage.from('portfolio-images').getPublicUrl(objectPath)
  const url = data.publicUrl
  await supabaseAdmin.from('portfolio_images').insert({ tenant_id: tenantId as any, project_id: projectId as any, url, alt: keySafeName, sort_order: 0 })
  await supabaseAdmin.from('portfolio_projects').update({ hero_image_url: url }).eq('id', projectId).eq('tenant_id', tenantId).is('hero_image_url', null)
  revalidateTag(tenantPortfolioTag(tenantId))
}



import Image from 'next/image'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchProjectBySlug } from '@/server/modules/portfolio/service'

export default async function ProjectDetail({ params }: { params: Promise<{ slug: string }> }) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return <main className="p-6">Unknown tenant</main>
  const { slug } = await params
  const { data: p } = await fetchProjectBySlug(tenantId, slug)
  if (!p) return <main className="p-6">Project not found</main>
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-brand">{p.title}</h1>
      {p.hero_image_url ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded border">
          <Image src={p.hero_image_url} alt={p.title} fill className="object-cover" />
        </div>
      ) : null}
      <p className="text-neutral-700">A showcase of our interior design work.</p>
    </main>
  )
}

import Image from 'next/image'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchProjectBySlug } from '@/server/modules/portfolio/service'

export default async function ProjectDetail({ params }: { params: Promise<{ slug: string }> }) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return <main className="p-6">Unknown tenant</main>
  const { slug } = await params
  const { data: p } = await fetchProjectBySlug(tenantId, slug)
  if (!p) return <main className="p-6">Project not found</main>
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-brand">{p.title}</h1>
      {p.hero_image_url ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded border">
          <Image src={p.hero_image_url} alt={p.title} fill className="object-cover" />
        </div>
      ) : null}
      <p className="text-neutral-700">A showcase of our interior design work.</p>
    </main>
  )
}



import Image from 'next/image'
import type { Metadata } from 'next'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchProjectBySlug, fetchProjectImages } from '@/server/modules/portfolio/service'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const tenantId = await resolveTenantIdFromRequest()
  const { slug } = await params
  if (!tenantId) return { title: 'Project | Bluebell' }
  const { data: p } = await fetchProjectBySlug(tenantId, slug)
  return { title: p?.title ? `${p.title} | Bluebell` : 'Project | Bluebell' }
}

export default async function BluebellProjectDetail({ params }: { params: Promise<{ slug: string }> }) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) return <main className="p-6">Unknown tenant</main>
  const { slug } = await params
  const { data: p } = await fetchProjectBySlug(tenantId, slug)
  if (!p) return <main className="p-6">Project not found</main>
  const { data: images } = await fetchProjectImages(tenantId, p.id)
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-3xl font-bold text-primary">{p.title}</h1>
      {p.location ? (
        <p className="text-brown text-sm">Location: {p.location}</p>
      ) : null}
      {p.hero_image_url ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded border">
          <Image src={p.hero_image_url} alt={p.title} fill className="object-cover" />
        </div>
      ) : null}
      <section className="prose max-w-none">
        {p.description ? <p>{p.description}</p> : <p>Project details coming soon.</p>}
      </section>
      {images && images.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold text-primary mb-3">Gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img) => (
              <div key={img.id} className="relative aspect-[4/3] w-full overflow-hidden rounded border">
                <Image src={img.url} alt={img.alt || p.title} fill className="object-cover" />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}



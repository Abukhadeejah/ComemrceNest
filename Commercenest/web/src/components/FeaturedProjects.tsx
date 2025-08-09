import Image from 'next/image'
import Link from 'next/link'
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchPublishedProjects } from '@/server/modules/portfolio/service'

export default async function FeaturedProjects() {
  const tenantId = await resolveTenantIdFromRequest()
  const { data } = tenantId ? await fetchPublishedProjects(tenantId) : { data: [] as Array<{ id: string; slug: string; title: string; hero_image_url: string | null }> }
  const items = (data ?? []).slice(0, 6)
  if (items.length === 0) return null
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-semibold text-primary">Featured Projects</h2>
        <Link className="text-sm underline" href="/portfolio">View all</Link>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <Link key={p.id} href={`/portfolio/${p.slug}`} className="group block overflow-hidden rounded border">
            <div className="relative aspect-[4/3] w-full">
              {p.hero_image_url ? (
                <Image src={p.hero_image_url} alt={p.title} fill className="object-cover transition group-hover:scale-[1.02]" />
              ) : <div className="h-full w-full bg-neutral-100" />}
            </div>
            <div className="p-3 text-sm">
              <div className="font-medium group-hover:text-primary">{p.title}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}



import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchCompanyProfileByTenantId } from '@/server/settings'

export default async function Hero() {
  const tenantId = await resolveTenantIdFromRequest()
  const { data: company } = tenantId ? await fetchCompanyProfileByTenantId(tenantId) : { data: null as any }
  const name = company?.name ?? 'Your Brand'
  return (
    <section className="brand-bg">
      <div className="mx-auto max-w-6xl px-6 py-20 md:flex md:items-center md:gap-12">
        <div className="md:w-1/2">
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl text-brand">
            {name}
          </h1>
          <p className="mt-4 max-w-xl text-neutral-700">
            Interior design, furnishings, and bespoke décor crafted to your style. Explore our latest collections and portfolio.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/" className="btn-brand rounded px-5 py-2 text-sm">Explore Products</a>
            <a href="/portfolio" className="rounded border border-brand px-5 py-2 text-sm">View Portfolio</a>
          </div>
        </div>
        <div className="mt-10 md:mt-0 md:w-1/2">
          <div className="aspect-[16/10] w-full overflow-hidden rounded-lg border border-neutral-200 bg-white/60 shadow-sm"></div>
        </div>
      </div>
    </section>
  )
}



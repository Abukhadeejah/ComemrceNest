import Link from 'next/link'
import { Playfair_Display, Inter } from 'next/font/google'
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700','800','900'] })
const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700'] })
import { resolveTenantIdFromRequest } from '@/server/tenant'
import { fetchPublishedProductsPaged, type ProductListParams, type ProductListItem } from '@/server/modules/products/service'
import { supabaseAdmin } from '@/server/supabaseAdmin'
import BreadcrumbProducts from '@/components/Breadcrumb'
type Category = { id: string; name: string }
import { ProductCard } from '@/modules/products/components/ProductCard'
import SortDropdown from '@/components/SortDropdown'

type SearchParams = {
  q?: string
  sort?: ProductListParams['sort']
  dir?: ProductListParams['dir']
  page?: string
  min?: string
  max?: string
  cat?: string
  rng?: 'u100' | '100-200' | '200p'
}

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<Partial<SearchParams>> }) {
  const tenantId = await resolveTenantIdFromRequest()
  if (!tenantId) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Products</h1>
        <p className="text-sm text-neutral-600">No tenant resolved.</p>
      </main>
    )
  }

  const sp: Partial<SearchParams> = (await (searchParams || Promise.resolve({}))) || {}
  const page = Math.max(1, Number(sp.page ?? '1') || 1)
  const sort = (sp.sort ?? 'updated_at') as ProductListParams['sort']
  const dir = (sp.dir ?? 'desc') as ProductListParams['dir']
  const q = sp.q?.toString() || undefined
  // Parse price range radio value into min/max if provided
  let min = sp.min ? Number(sp.min) : undefined
  let max = sp.max ? Number(sp.max) : undefined
  if (sp.rng) {
    if (sp.rng === 'u100') { min = 0; max = 100 }
    if (sp.rng === '100-200') { min = 100; max = 200 }
    if (sp.rng === '200p') { min = 200; max = undefined }
  }
  const categoryId = sp['cat']?.toString()

  const { data, count } = await fetchPublishedProductsPaged(tenantId, {
    page,
    sort,
    dir,
    q,
    minPriceCents: typeof min === 'number' && !Number.isNaN(min) ? Math.round(min * 100) : undefined,
    maxPriceCents: typeof max === 'number' && !Number.isNaN(max) ? Math.round(max * 100) : undefined,
    pageSize: 12,
  })
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / 12))
  const showing = Array.isArray(data) ? data.length : 0

  const mkHref = (p: number) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (sort) params.set('sort', sort)
    if (dir) params.set('dir', dir)
    if (sp.min) params.set('min', sp.min)
    if (sp.max) params.set('max', sp.max)
    if (categoryId) params.set('cat', categoryId)
    if (sp.rng) params.set('rng', sp.rng)
    params.set('page', String(p))
    return `/products?${params.toString()}`
  }

  return (
    <>
      <BreadcrumbProducts />
      <main className="mx-auto max-w-7xl p-6 bg-white">
      {/* Page header */}
      <div className="text-center mb-12">
        <h1 className={`${playfair.className} text-5xl md:text-7xl font-black text-[color:var(--color-primary)] leading-tight`}>
          Featured Fabrics
        </h1>
        <div className="w-32 h-1 bg-[color:var(--color-mustard)] mx-auto mt-4 mb-6 rounded-full" />
        <p className="text-brown text-lg md:text-xl max-w-3xl mx-auto">
          Discover our curated collection of premium fabrics for exceptional interior design
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 lg:sticky lg:top-24">
            <h3 className={`${playfair.className} text-2xl font-black text-[color:var(--color-primary)] mb-6`}>Filter & Sort</h3>
            <form action="/products" className="space-y-6">
              {/* Sort By */}
              <SortDropdown
                name="sort"
                initialValue={String(sort)}
                options={[
                  { value: 'updated_at', label: 'Popularity' },
                  { value: 'price_cents', label: 'Price' },
                  { value: 'name', label: 'Name' },
                ]}
              />

              {/* Fabric Type (Category) */}
              <div>
                <div className={`block font-semibold mb-3 ${inter.className} text-[color:var(--color-brown)]`}>Fabric Type</div>
                <div className="space-y-2">
                  {/* All types */}
                  <label className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition hover:-translate-y-0.5 hover:bg-neutral-50` }>
                    <input type="radio" name="cat" value="" defaultChecked={!categoryId} className="sr-only" />
                    <span className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${!categoryId ? 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)]' : 'bg-white border-neutral-300 group-hover:border-[color:var(--color-primary)]'}` }>
                      { !categoryId ? <span className="h-2.5 w-2.5 rounded-sm bg-white" /> : null }
                    </span>
                    <span className={`${inter.className} text-[color:var(--color-brown)] font-medium`}>All Types</span>
                  </label>
                  {(categories as Category[] | null ?? []).map((c: Category) => {
                    const active = categoryId === c.id
                    return (
                      <label key={c.id} className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition hover:-translate-y-0.5 hover:bg-neutral-50`}>
                        <input type="radio" name="cat" value={c.id} defaultChecked={active} className="sr-only" />
                        <span className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${active ? 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)]' : 'bg-white border-neutral-300 group-hover:border-[color:var(--color-primary)]'}` }>
                          { active ? <span className="h-2.5 w-2.5 rounded-sm bg-white" /> : null }
                        </span>
                        <span className={`${inter.className} text-[color:var(--color-brown)] font-medium`}>{c.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <div className={`block font-semibold mb-3 ${inter.className} text-[color:var(--color-brown)]`}>Price Range</div>
                <div className="space-y-2">
                  {([
                    { key: 'u100', label: 'Under ₹100', min: 0, max: 100 },
                    { key: '100-200', label: '₹100 – ₹200', min: 100, max: 200 },
                    { key: '200p', label: '₹200+', min: 200, max: undefined },
                  ] as const).map((r) => {
                    const isActive = sp.rng === r.key
                    return (
                      <label key={r.key} className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition hover:-translate-y-0.5 hover:bg-neutral-50`}>
                        <input type="radio" name="rng" value={r.key} defaultChecked={isActive} className="sr-only" />
                        <span className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${isActive ? 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)]' : 'bg-white border-neutral-300 group-hover:border-[color:var(--color-primary)]'}` }>
                          { isActive ? <span className="h-2.5 w-2.5 rounded-sm bg-white" /> : null }
                        </span>
                        <span className={`${inter.className} text-[color:var(--color-brown)] font-medium`}>{r.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-1">
                <button type="submit" className="w-full h-11 rounded-xl bg-[color:var(--color-mustard)] text-[color:var(--color-brown)] font-semibold transition transform hover:scale-[1.02]">Apply Filters</button>
                <Link href="/products" className="w-full inline-flex items-center justify-center h-11 rounded-xl bg-[color:var(--color-crimson)] text-white font-semibold transition transform hover:scale-[1.02]">Clear All Filters</Link>
              </div>
            </form>
          </div>
        </aside>

        {/* Main grid */}
        <section className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-gray-50 rounded-2xl p-6">
            <p className="text-brown text-base">
              Showing <span className="font-bold text-[color:var(--color-primary)]">{showing}</span> of{' '}
              <span className="font-bold text-[color:var(--color-primary)]">{total}</span> products
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-10">
            {((Array.isArray(data) ? (data as unknown as ProductListItem[]) : [])).length === 0 ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                  <div className="relative aspect-[4/3] w-full bg-neutral-100">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.8s_linear_infinite]" />
                  </div>
                  <div className="p-6">
                    <div className="h-4 w-3/5 rounded bg-neutral-200 mb-3" />
                    <div className="h-3 w-full rounded bg-neutral-200 mb-2" />
                    <div className="h-3 w-4/5 rounded bg-neutral-200 mb-5" />
                    <div className="h-10 w-full rounded-xl bg-neutral-200" />
                  </div>
                </div>
              ))
            ) : (
              (data as unknown as ProductListItem[]).map((p, idx) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="block">
                  <ProductCard
                    name={p.name}
                    priceCents={p.price_cents}
                    imageUrl={p.hero_image_url ?? undefined}
                    badgeText={idx % 3 === 1 ? 'Luxury' : idx % 3 === 2 ? 'Elegant' : 'Premium'}
                    accent={idx % 2 === 0 ? 'primary' : 'mustard'}
                  />
                </Link>
              ))
            )}
          </div>

          <div className="mt-10 bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2">
                <Link
                  href={mkHref(Math.max(1, page - 1))}
                  aria-disabled={page === 1}
                  className={`group rounded-lg bg-white border border-gray-300 text-[color:var(--color-brown)] px-3 py-2 transition-transform hover:scale-[1.03] hover:shadow-sm ${page === 1 ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <svg className="mr-1 inline h-4 w-4 text-gray-400 transition-colors group-hover:text-[color:var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                  Prev
                </Link>
                {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={mkHref(n)}
                    className={`rounded-lg px-3 py-2 border transition-all hover:scale-[1.03] hover:shadow-sm ${
                      n === page
                        ? 'bg-[color:var(--color-primary)] border-[color:var(--color-primary)] text-white'
                        : 'bg-white border-gray-300 text-[color:var(--color-brown)]'
                    }`}
                  >
                    {n}
                  </Link>
                ))}
                <Link
                  href={mkHref(Math.min(totalPages, page + 1))}
                  aria-disabled={page === totalPages}
                  className={`group rounded-lg bg-white border border-gray-300 text-[color:var(--color-brown)] px-3 py-2 transition-transform hover:scale-[1.03] hover:shadow-sm ${page === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Next
                  <svg className="ml-1 inline h-4 w-4 text-gray-400 transition-colors group-hover:text-[color:var(--color-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                </Link>
              </div>
              <div className="text-sm text-[color:var(--color-brown)]">Page {page} of {totalPages} - {total} products total</div>
          </div>
        </section>
      </div>
      </main>
    </>
  )
}



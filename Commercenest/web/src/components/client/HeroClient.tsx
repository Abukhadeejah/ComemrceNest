"use client"
import Link from 'next/link'

export default function HeroClient() {
  return (
    <section className="brand-bg">
      <div className="mx-auto max-w-6xl px-6 py-16 md:flex md:items-center md:gap-12">
        <div className="md:w-1/2">
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl text-brand">Welcome</h1>
          <p className="mt-4 max-w-xl text-neutral-700">
            Curated interiors, furnishings, and bespoke décor. This is a placeholder hero while we finalize the server-driven design.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="btn-brand rounded px-5 py-2 text-sm">Explore Products</Link>
            <Link href="/portfolio" className="rounded border border-brand px-5 py-2 text-sm">View Portfolio</Link>
          </div>
        </div>
        <div className="mt-10 md:mt-0 md:w-1/2">
          <div className="aspect-[16/10] w-full overflow-hidden rounded-lg border border-neutral-200 bg-white/60 shadow-sm" />
        </div>
      </div>
    </section>
  )
}



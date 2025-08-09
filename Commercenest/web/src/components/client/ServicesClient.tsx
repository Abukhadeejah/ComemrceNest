"use client"

export default function ServicesClient() {
  const items = [
    { t: 'Space Planning', d: 'Functional layouts and zoning tailored to your lifestyle.' },
    { t: 'Material & Finish', d: 'Curated palettes and textures to elevate every room.' },
    { t: 'Custom Furniture', d: 'Bespoke pieces crafted to fit your space perfectly.' },
  ]
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h2 className="text-2xl font-semibold text-primary">Our Services</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((s) => (
          <div key={s.t} className="rounded-lg border p-5 transition hover:border-mustard">
            <div className="text-lg font-semibold text-primary">{s.t}</div>
            <p className="mt-2 text-sm text-neutral-700">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}




import ServiceCard from './ServiceCard'

export default function Services() {
  const items = [
    { title: 'Space Planning', description: 'Functional layouts and zoning tailored to your lifestyle.' },
    { title: 'Material & Finish', description: 'Curated palettes and textures to elevate every room.' },
    { title: 'Custom Furniture', description: 'Bespoke pieces crafted to fit your space perfectly.' },
  ]
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h2 className="text-2xl font-semibold text-primary">Our Services</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((s) => (
          <ServiceCard key={s.title} title={s.title} description={s.description} />
        ))}
      </div>
    </section>
  )
}



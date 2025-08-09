export default function Testimonials() {
  const items = [
    { quote: 'They transformed our home beyond expectations.', author: 'Client A' },
    { quote: 'Exceptional taste and attention to detail.', author: 'Client B' },
  ]
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h2 className="text-2xl font-semibold text-primary">Testimonials</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((t, i) => (
          <blockquote key={i} className="rounded-lg border p-5">
            <p className="text-neutral-800">“{t.quote}”</p>
            <footer className="mt-2 text-sm text-neutral-600">— {t.author}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  )
}



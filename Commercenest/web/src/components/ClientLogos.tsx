export default function ClientLogos() {
  const logos = ['ClientOne', 'ClientTwo', 'ClientThree', 'ClientFour']
  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {logos.map((name) => (
          <div key={name} className="flex h-12 items-center justify-center rounded border bg-white/60 text-sm text-neutral-500">
            {name}
          </div>
        ))}
      </div>
    </section>
  )
}



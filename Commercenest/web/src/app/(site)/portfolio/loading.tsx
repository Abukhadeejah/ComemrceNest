export default function Loading() {
  return (
    <main className="p-6 space-y-4">
      <div className="h-6 w-48 animate-pulse rounded bg-neutral-200" />
      <ul className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="rounded border p-3 space-y-2">
            <div className="aspect-[4/3] w-full animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-200" />
          </li>
        ))}
      </ul>
    </main>
  )
}



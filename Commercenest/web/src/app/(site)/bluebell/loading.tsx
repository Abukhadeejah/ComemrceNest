export default function Loading() {
  return (
    <main className="p-6 space-y-4">
      <div className="h-6 w-40 animate-pulse rounded bg-blue-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded border p-4 space-y-2">
            <div className="aspect-[4/3] w-full animate-pulse rounded bg-blue-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-blue-200" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-blue-200" />
          </div>
        ))}
      </div>
    </main>
  )
}






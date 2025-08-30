export default function Loading() {
  return (
    <main className="p-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square w-full animate-pulse rounded bg-neutral-200" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 w-20 animate-pulse rounded bg-neutral-200" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-7 w-2/3 animate-pulse rounded bg-neutral-200" />
          <div className="h-5 w-1/3 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-200" />
          <div className="h-24 w-full animate-pulse rounded bg-neutral-200" />
          <div className="h-10 w-40 animate-pulse rounded bg-neutral-200" />
        </div>
      </div>
    </main>
  )
}








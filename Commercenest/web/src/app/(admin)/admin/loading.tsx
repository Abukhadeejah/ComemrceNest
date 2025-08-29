export default function Loading() {
  return (
    <main className="p-6 space-y-6">
      <div className="h-7 w-48 animate-pulse rounded bg-neutral-200" />
      <div className="flex items-center gap-3">
        <div className="h-9 w-32 animate-pulse rounded bg-neutral-200" />
        <div className="h-9 w-24 animate-pulse rounded bg-neutral-200" />
        <div className="h-9 w-40 animate-pulse rounded bg-neutral-200" />
      </div>
      <div className="rounded border">
        <div className="grid grid-cols-12 gap-2 border-b p-4">
          <div className="col-span-3 h-4 animate-pulse rounded bg-neutral-200" />
          <div className="col-span-3 h-4 animate-pulse rounded bg-neutral-200" />
          <div className="col-span-2 h-4 animate-pulse rounded bg-neutral-200" />
          <div className="col-span-2 h-4 animate-pulse rounded bg-neutral-200" />
          <div className="col-span-2 h-4 animate-pulse rounded bg-neutral-200" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 p-4">
              <div className="col-span-3 h-4 animate-pulse rounded bg-neutral-200" />
              <div className="col-span-3 h-4 animate-pulse rounded bg-neutral-200" />
              <div className="col-span-2 h-4 animate-pulse rounded bg-neutral-200" />
              <div className="col-span-2 h-4 animate-pulse rounded bg-neutral-200" />
              <div className="col-span-2 h-4 animate-pulse rounded bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}






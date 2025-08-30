export default function Loading() {
  return (
    <div className="min-h-[50vh] grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600" />
        <p className="text-sm text-gray-600">Signing you in…</p>
      </div>
    </div>
  )
}





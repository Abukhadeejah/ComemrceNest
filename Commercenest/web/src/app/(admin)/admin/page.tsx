export const dynamic = 'force-dynamic'

export default async function AdminHome() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <form action="/api/auth/signout" method="post">
        <button className="rounded bg-neutral-800 px-3 py-2 text-white">Sign out</button>
      </form>
      <ul className="list-disc pl-6">
        <li><a className="underline" href="/admin/products">Products</a></li>
        <li><a className="underline" href="/admin/portfolio">Portfolio</a></li>
        <li><a className="underline" href="/admin/orders">Orders</a></li>
      </ul>
      <p className="text-sm text-neutral-600">Note: Admin is gated; use test keys until live review.</p>
    </main>
  )
}



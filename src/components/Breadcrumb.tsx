import Link from 'next/link'

export default function BreadcrumbProducts() {
  return (
    <div className="border-b border-[#f9fafb] bg-[#f9fafb]">
      <nav className="mx-auto flex max-w-7xl items-center gap-2 px-6 py-3 text-sm">
        <Link
          href="/"
          className="group relative text-[color:var(--color-brown)] transition-colors hover:text-[color:var(--color-primary)]"
        >
          Home
          <span className="pointer-events-none absolute -bottom-0.5 left-0 h-0.5 w-0 bg-gradient-to-r from-[color:var(--color-crimson)] to-[color:var(--color-mustard)] transition-all duration-300 group-hover:w-full" />
        </Link>
        <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[color:var(--color-primary)] font-medium">Products</span>
      </nav>
    </div>
  )
}



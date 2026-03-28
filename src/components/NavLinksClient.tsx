"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

type Item = { href: string; label: string; external?: boolean }

interface NavLinksClientProps {
  items: Item[]
}

export default function NavLinksClient({ items }: NavLinksClientProps) {
  const pathname = usePathname() || '/'
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="hidden md:flex items-center gap-8">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== '/' && pathname.startsWith(it.href))
          return (
            <Link
              key={it.href}
              href={it.href}
              className="relative text-[color:var(--color-brown)] transition-colors hover:text-[color:var(--color-crimson)]"
            >
              {it.label}
              {active ? (
                <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-[color:var(--color-primary)]" />
              ) : null}
            </Link>
          )
        })}
      </nav>

      {/* mobile */}
      <button
        aria-label="Toggle menu"
        className="md:hidden text-[color:var(--color-primary)] hover:text-[color:var(--color-crimson)] transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {open ? (
        <div className="md:hidden mt-3 rounded-xl border bg-white p-3 shadow-sm">
          {items.map((it) => {
            const active = pathname === it.href || (it.href !== '/' && pathname.startsWith(it.href))
            return (
              <Link
                key={it.href}
                href={it.href}
                className="block rounded px-3 py-2 text-[color:var(--color-brown)] hover:bg-[color:var(--color-mustard)]/10 hover:text-[color:var(--color-crimson)]"
                onClick={() => setOpen(false)}
              >
                <span className="relative">
                  {it.label}
                  {active ? (
                    <span className="absolute -bottom-0.5 left-0 h-0.5 w-full bg-[color:var(--color-primary)]" />
                  ) : null}
                </span>
              </Link>
            )
          })}
        </div>
      ) : null}
    </>
  )
}



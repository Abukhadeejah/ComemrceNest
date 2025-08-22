'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTenant } from '@/hooks/useTenant'
import NavLinksClient from './NavLinksClient'

export default function SiteHeader() {
  const tenant = useTenant()
  const name = tenant.brand.name
  const menuItems = tenant.navigation.mainMenu
  const accent = tenant.theme.colors.accent || tenant.theme.colors.primary
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#f7fafc] shadow-sm px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-[1.02]">
          {tenant.brand.logo ? (
            <div className="relative h-8 w-8 overflow-hidden rounded">
              <Image src={tenant.brand.logo} alt={name} fill sizes="32px" className="object-contain" />
            </div>
          ) : (
            <svg width="34" height="34" viewBox="0 0 220 140" className="drop-shadow">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#01589D" />
                  <stop offset="50%" stopColor="#FDCE59" />
                  <stop offset="100%" stopColor="#DC2A38" />
                </linearGradient>
              </defs>
              <g transform="translate(40, 10)">
                <path d="M0 90 Q-25 55 0 20 Q25 55 0 90" fill="url(#logoGrad)" />
                <circle cx="0" cy="20" r="8" fill="#01589D" />
              </g>
            </svg>
          )}
          <div>
            <div className="font-serif text-xl font-bold" style={{ color: String(accent) }}>{name}</div>
            <div className="-mt-1 text-xs tracking-[0.35em] text-[color:var(--color-brown)]">FABRICS</div>
          </div>
        </Link>
        <NavLinksClient items={menuItems} />
      </div>
    </header>
  )
}



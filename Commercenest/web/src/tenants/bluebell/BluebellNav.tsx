"use client"
import { useEffect, useState } from 'react'

export default function BluebellNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'nav-blur shadow-2xl' : 'bg-white/90'} backdrop-saturate-150`}
      aria-label="Primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="#home" className="flex items-center gap-2">
            <span className="sr-only">Bluebell Fabrics</span>
            <svg width="32" height="32" viewBox="0 0 32 32">
              <path d="M16 24 Q12 18 16 12 Q20 18 16 24" fill="var(--color-primary)" opacity="0.85" />
              <circle cx="16" cy="12" r="2" fill="var(--color-crimson)" opacity="0.8" />
            </svg>
            <span className="font-semibold text-primary tracking-wide">Bluebell</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-brown">
            {[
              { href: '#home', label: 'Home' },
              { href: '#portfolio', label: 'Portfolio' },
              { href: '#products', label: 'Products' },
              { href: '#contact', label: 'Contact' },
            ].map((l) => (
              <a key={l.href} href={l.href} className="relative group font-medium">
                <span className="transition-colors group-hover:text-crimson">{l.label}</span>
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-crimson transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}



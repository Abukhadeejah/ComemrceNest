'use client'

import Link from 'next/link'
import { useTenant } from '@/hooks/useTenant'

export default function SiteFooter() {
  const tenant = useTenant()
  const name = tenant.brand.name
  const year = new Date().getFullYear()
  const quickLinks = tenant.navigation.footerLinks?.quickLinks || []
  const contact = tenant.content.contact

  return (
    <footer className="relative overflow-hidden text-white bg-gradient-to-br from-[color:var(--color-primary)] via-blue-800 to-[color:var(--color-primary)] pt-16 pb-8">
      {/* subtle pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-5">
        <svg width="100" height="100" viewBox="0 0 100 100" className="w-full h-full">
          <pattern id="footer-pattern" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
            <circle cx="12.5" cy="12.5" r="1" fill="#ffffff" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#footer-pattern)"/>
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12 mb-12">
          {/* Brand + copy */}
          <div className="md:col-span-2">
            {/* Logo placeholder (replace with real logo when ready) */}
            <div className="flex items-center gap-3 mb-4">
              <svg width="34" height="34" viewBox="0 0 220 140" className="drop-shadow">
                <g transform="translate(40, 10)">
                  <defs>
                    <radialGradient id="footerPetal" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FEFEFE" stopOpacity="1" />
                      <stop offset="100%" stopColor="#01589D" stopOpacity="0.85" />
                    </radialGradient>
                  </defs>
                  <path d="M0 90 Q-25 55 0 20 Q25 55 0 90" fill="url(#footerPetal)" stroke="#FEFEFE" strokeWidth="4" />
                  <circle cx="0" cy="20" r="8" fill="#01589D" />
                </g>
              </svg>
              <div>
                <div className="text-lg font-bold leading-none">{name}</div>
                {tenant.brand.tagline && (
                  <div className="text-xs text-white/85 leading-none mt-1">{tenant.brand.tagline.toUpperCase()}</div>
                )}
              </div>
            </div>
            <p className="text-white/80 max-w-md leading-relaxed mb-6">
              {tenant.brand.tagline || 'Your trusted e-commerce partner'}
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[color:var(--color-mustard)] flex items-center justify-center">
                <svg className="w-5 h-5 text-[color:var(--color-brown)]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <div>
                <p className="font-semibold">Award Winning</p>
                <p className="text-white/70 text-sm">Design Excellence</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-[color:var(--color-mustard)]">Quick Links</h3>
            <ul className="space-y-3 text-white/85">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="group inline-flex items-center gap-2 hover:text-[color:var(--color-mustard)] transition-colors">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-crimson)] group-hover:bg-[color:var(--color-mustard)]"/>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-[color:var(--color-mustard)]">Get In Touch</h3>
            <div className="space-y-4 text-white/85">
              {contact?.address && (
                <div>
                  <p>{contact.address}</p>
                </div>
              )}
              {contact?.phone && <p>{contact.phone}</p>}
              {contact?.email && <p>{contact.email}</p>}
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-10 border border-white/15">
          <div className="text-center mb-4">
            <h4 className="font-serif text-2xl md:text-3xl font-extrabold">Stay Inspired</h4>
            <p className="text-white/80">Subscribe to our newsletter for design tips and exclusive fabric collections</p>
          </div>
          <div className="max-w-md mx-auto flex gap-3">
            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-[color:var(--color-mustard)] transition-colors" />
            <button className="px-5 py-3 rounded-xl bg-[color:var(--color-mustard)] text-[color:var(--color-brown)] font-semibold hover:brightness-110 transition">
              Subscribe
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/15 pt-6 text-white/80">
          <div className="flex gap-3">
            {[
              { viewBox: '0 0 24 24', d: 'M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z' },
              { viewBox: '0 0 24 24', d: 'M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z' },
              { viewBox: '0 0 24 24', d: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z' },
            ].map((s, i) => (
              <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition">
                <svg className="w-5 h-5" viewBox={s.viewBox} fill="currentColor"><path d={s.d} /></svg>
              </a>
            ))}
          </div>
          <div className="text-sm">© {year} {name}. All rights reserved.</div>
          <div className="text-xs text-white/70">Crafted with ❤️ for beautiful interiors</div>
        </div>
      </div>
    </footer>
  )
}


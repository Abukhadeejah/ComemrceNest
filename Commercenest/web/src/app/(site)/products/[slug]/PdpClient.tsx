"use client"
import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Playfair_Display, Inter } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700','800','900'] })
const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700'] })

export type PdpImage = { id: string; url: string; alt?: string | null }

type Props = {
  name: string
  description?: string | null
  hero_image_url?: string | null
  images: PdpImage[]
  price_cents: number
}

export default function PdpClient({ name, description, hero_image_url, images, price_cents }: Props) {
  const gallery = useMemo(() => {
    const base = hero_image_url ? [{ id: 'hero', url: hero_image_url, alt: name }] : []
    const merged = [...base, ...images]
    const seen = new Set<string>()
    return merged.filter(img => {
      const key = img.url
      if (!key) return false
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [hero_image_url, images, name])
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [origin, setOrigin] = useState<{x:number;y:number}>({ x: 50, y: 50 })
  const [qty, setQty] = useState(1)

  const price = useMemo(() => {
    return (price_cents / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
  }, [price_cents])

  return (
    <>
      {/* Breadcrumb (flush under navbar, no extra top spacing) */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="group relative font-medium text-[color:var(--color-brown)] transition-colors hover:text-[color:var(--color-primary)]">
              Home
              <span className="pointer-events-none absolute -bottom-0.5 left-0 h-0.5 w-0 bg-gradient-to-r from-[color:var(--color-crimson)] to-[color:var(--color-mustard)] transition-all duration-300 group-hover:w-full" />
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            <Link href="/products" className="group relative font-medium text-[color:var(--color-brown)] transition-colors hover:text-[color:var(--color-primary)]">
              Products
              <span className="pointer-events-none absolute -bottom-0.5 left-0 h-0.5 w-0 bg-gradient-to-r from-[color:var(--color-crimson)] to-[color:var(--color-mustard)] transition-all duration-300 group-hover:w-full" />
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            <span className="text-[color:var(--color-primary)] font-semibold">{name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="lg:sticky lg:top-28 self-start">
          <div
            className="group relative w-full overflow-hidden rounded-2xl border border-gray-2 00 shadow-sm aspect-[4/3] bg-white cursor-zoom-in"
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
            onMouseMove={(e) => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
              const x = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))
              const y = Math.max(0, Math.min(100, ((e.clientY - r.top) / r.height) * 100))
              setOrigin({ x, y })
            }}
          >
            {/* Fabric texture overlays */}
            <div className="absolute inset-0 opacity-20 [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.15)_0px,rgba(255,255,255,0.15)_10px,transparent_10px,transparent_20px)] pointer-events-none" />
            <div className="absolute inset-0 opacity-10 [background:radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4)_2px,transparent_2px),radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.15)_1px,transparent_1px)] [background-size:18px_18px,14px_14px] pointer-events-none" />
            {gallery[index] ? (
              <Image
                key={gallery[index].url}
                src={gallery[index].url}
                alt={gallery[index].alt || name}
                fill
                className={`object-cover transition-transform duration-200 ease-out animate-fadeIn ${zoom ? 'scale-110' : 'scale-100'}`}
                style={{ transformOrigin: `${origin.x}% ${origin.y}%` }}
              />
            ) : (
              <div className="h-full w-full bg-neutral-100" />
            )}
            {/* Badge */}
            <div className="absolute top-4 right-4 rounded-full bg-[color:var(--color-mustard)] text-[color:var(--color-brown)] px-3 py-1 text-xs font-bold shadow-lg">Premium Quality</div>
            {/* Zoom indicator */}
            <div className={`absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-[color:var(--color-brown)] rounded-full px-3 py-1 text-xs shadow flex items-center gap-1 transition-opacity ${zoom ? 'opacity-0' : 'opacity-100'}`}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
              Hover to zoom
            </div>
          </div>
          {gallery.length > 1 ? (
            <div className="mt-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 min-w-max pr-1">
                {gallery.map((img, i) => (
                  <button
                    key={img.id + i}
                    onClick={() => setIndex(i)}
                    className={`group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border transition-all ${
                      i===index ? 'border-[color:var(--color-primary)] ring-2 ring-[color:var(--color-primary)] scale-105' : 'border-gray-200 hover:border-[color:var(--color-primary)] hover:shadow hover:scale-105'
                    }`}
                  >
                    <Image src={img.url} alt={img.alt || name} fill className="object-cover" />
                    {/* subtle texture on thumbs */}
                    <div className="absolute inset-0 opacity-10 [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.3)_0px,rgba(255,255,255,0.3)_6px,transparent_6px,transparent_12px)]" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Details */}
        <div>
          <h1 className={`${playfair.className} text-4xl md:text-6xl font-black text-[color:var(--color-primary)] leading-tight mb-2`}>{name}</h1>
          <div className="w-28 h-1 bg-[color:var(--color-mustard)] rounded-full mb-4" />
          <div className={`${inter.className} text-[color:var(--color-mustard)] font-semibold mb-4`}>Premium Interior Fabric Collection</div>

          {/* Rating + stock */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1 text-[color:var(--color-mustard)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              ))}
            </div>
            <div className={`${inter.className} text-[color:var(--color-brown)] text-sm`}>(47 reviews)</div>
            <div className="text-emerald-600 text-sm font-semibold">✓ In Stock</div>
          </div>
          <p className={`${inter.className} text-[color:var(--color-brown)] text-lg leading-relaxed mb-6`}>{description || 'Premium fabric with refined texture and exceptional durability.'}</p>

          <div className="flex items-end gap-4 mb-8">
            <div className="text-3xl md:text-4xl font-extrabold text-[color:var(--color-crimson)]">{price}</div>
            <div className={`${inter.className} text-[color:var(--color-brown)]`}>per metre</div>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center gap-3 mb-6">
            <span className={`${inter.className} text-[color:var(--color-brown)] font-semibold`}>Quantity</span>
            <div className="inline-flex items-center rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q-1))} className="w-10 h-10 grid place-items-center text-[color:var(--color-primary)] hover:bg-neutral-50">-</button>
              <div className="px-4 font-semibold text-[color:var(--color-brown)] select-none">{qty}</div>
              <button onClick={() => setQty(q => Math.min(99, q+1))} className="w-10 h-10 grid place-items-center text-[color:var(--color-primary)] hover:bg-neutral-50">+</button>
            </div>
          </div>

          {/* CTA */}
          <div className="ripple inline-block w-full sm:w-auto" onMouseDown={(e) => {
            const t = e.currentTarget as HTMLElement
            const r = t.getBoundingClientRect()
            t.style.setProperty('--x', `${e.clientX - r.left}px`)
            t.style.setProperty('--y', `${e.clientY - r.top}px`)
            t.classList.remove('active'); void t.offsetWidth; t.classList.add('active')
          }}>
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-mustard)] text-[color:var(--color-brown)] px-8 py-4 font-semibold shadow-[0_12px_40px_rgba(253,206,89,0.35)] transition-all hover:shadow-[0_16px_50px_rgba(253,206,89,0.55)] hover:-translate-y-0.5">
              Add to Cart
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>

          {/* Details sections */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className={`${playfair.className} text-2xl font-bold text-[color:var(--color-primary)] mb-3`}>Material & Care</h3>
              <ul className={`${inter.className} list-disc pl-5 text-[color:var(--color-brown)] space-y-1`}>
                <li>Premium cotton blend</li>
                <li>Dry clean recommended</li>
                <li>Fade-resistant dye</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className={`${playfair.className} text-2xl font-bold text-[color:var(--color-primary)] mb-3`}>Shipping</h3>
              <p className={`${inter.className} text-[color:var(--color-brown)]`}>Ships within 3–5 business days across India.</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}



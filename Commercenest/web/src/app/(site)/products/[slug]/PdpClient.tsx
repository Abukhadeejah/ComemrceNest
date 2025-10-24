"use client"
import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Playfair_Display, Inter } from 'next/font/google'
import { useCart } from '@/lib/cart'
// UPDATED IMPORT - Use helper functions
import { WHATSAPP_NUMBER, getProductInquiryLink, shouldShowAddToCart } from '@/tenants/bluebell/config'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700','800','900'] })
const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700'] })

export type PdpImage = { id: string; url: string; alt?: string | null }

type Props = {
  productId?: string
  name: string
  description?: string | null
  hero_image_url?: string | null
  images: PdpImage[]
  price_cents: number
  tenantKey?: string
}

export default function PdpClient({ productId, name, description, hero_image_url, images, price_cents, tenantKey }: Props) {
  const { addItem } = useCart()
  const router = useRouter()
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Safe URL normalizer
  const safeUrl = (url?: string | null): string => {
    if (!url) return ''
    let str = url.trim().replace(/^(https?:)\/(?!\/)/, '$1//')
    if (/["'%\[\]]/.test(str)) {
      const m = str.match(/https?:\/\/[^\s'"\]\)]+/)
      if (m) str = m[0]
    }
    return str.replace(/\/+$/, '')
  }

  const gallery = useMemo(() => {
    const allowedExt = /\.(png|jpe?g|webp|gif|avif|svg)$/i
    const folderPrefix = productId
      ? `/storage/v1/object/public/product-images/${productId}/`
      : null

    const base = hero_image_url ? [{ id: 'hero', url: safeUrl(hero_image_url), alt: name }] : []
    const normalizedImages = images.map(img => ({ ...img, url: safeUrl(img.url) }))
    const merged = [...base, ...normalizedImages]
    const seen = new Set<string>()

    return merged.filter(img => {
      const url = img.url
      if (!url) return false
      if (seen.has(url)) return false
      if (folderPrefix && !url.includes(folderPrefix)) return false
      try {
        const { pathname } = new URL(url)
        if (!allowedExt.test(pathname)) return false
      } catch {
        return false
      }
      seen.add(url)
      return true
    })
  }, [hero_image_url, images, name, productId])
  
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [origin, setOrigin] = useState<{x:number;y:number}>({ x: 50, y: 50 })
  const [qty, setQty] = useState(1)

  // Keep price for cart functionality but don't display it
  const price = useMemo(() => {
    return (price_cents / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
  }, [price_cents])

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    try {
      if (!productId) {
        console.error('Missing productId on PDP; cannot add to cart')
        return
      }
      addItem({
        productId,
        name,
        price: price_cents,
        imageUrl: hero_image_url || images[0]?.url,
        quantity: qty
      })
      router.push('/cart')
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  // UPDATED - Use helper function
  const whatsappLink = getProductInquiryLink(name)
  
  // Check if e-commerce is enabled
  const showEcommerce = shouldShowAddToCart()

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href={tenantKey ? `/${tenantKey}` : "/"} className="group relative font-medium text-[color:var(--color-brown)] transition-colors hover:text-[color:var(--color-primary)]">
              Home
              <span className="pointer-events-none absolute -bottom-0.5 left-0 h-0.5 w-0 bg-gradient-to-r from-[color:var(--color-crimson)] to-[color:var(--color-mustard)] transition-all duration-300 group-hover:w-full" />
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            <Link href={tenantKey ? `/${tenantKey}/products` : "/products"} className="group relative font-medium text-[color:var(--color-brown)] transition-colors hover:text-[color:var(--color-primary)]">
              Products
              <span className="pointer-events-none absolute -bottom-0.5 left-0 h-0.5 w-0 bg-gradient-to-r from-[color:var(--color-crimson)] to-[color:var(--color-mustard)] transition-all duration-300 group-hover:w-full" />
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7-7"/></svg>
            <span className="text-[color:var(--color-primary)] font-semibold">{name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="lg:sticky lg:top-28 self-start">
          <div
            className="group relative w-full overflow-hidden rounded-2xl border border-gray-200 shadow-sm aspect-[4/3] bg-white cursor-zoom-in"
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
                unoptimized
                className={`object-cover transition-transform duration-200 ease-out animate-fadeIn ${zoom ? 'scale-110' : 'scale-100'}`}
                style={{ transformOrigin: `${origin.x}% ${origin.y}%` }}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 flex items-center justify-center">
                <div className="text-center text-blue-600">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Image Coming Soon</p>
                </div>
              </div>
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
                    <Image src={img.url} alt={img.alt || name} fill unoptimized className="object-cover" />
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

          {/* WhatsApp Button - Show when e-commerce is disabled */}
          {!showEcommerce && (
            <div className="mb-6">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-4 text-center text-base font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#20BA5A] active:scale-[0.98]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Message on WhatsApp
              </a>
            </div>
          )}

          {/* E-COMMERCE SECTION - Only show when enabled */}
          {showEcommerce && (
            <>
              {/* Quantity selector */}
              <div className="flex items-center gap-3 mb-6">
                <span className={`${inter.className} text-[color:var(--color-brown)] font-semibold`}>Quantity</span>
                <div className="inline-flex items-center rounded-xl border border-gray-200 overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q-1))} className="w-10 h-10 grid place-items-center text-[color:var(--color-primary)] hover:bg-neutral-50">-</button>
                  <div className="px-4 font-semibold text-[color:var(--color-brown)] select-none">{qty}</div>
                  <button onClick={() => setQty(q => Math.min(99, q+1))} className="w-10 h-10 grid place-items-center text-[color:var(--color-primary)] hover:bg-neutral-50">+</button>
                </div>
              </div>

              {/* Add to Cart CTA */}
              <div className="ripple inline-block w-full sm:w-auto" onMouseDown={(e) => {
                const t = e.currentTarget as HTMLElement
                const r = t.getBoundingClientRect()
                t.style.setProperty('--x', `${e.clientX - r.left}px`)
                t.style.setProperty('--y', `${e.clientY - r.top}px`)
                t.classList.remove('active'); void t.offsetWidth; t.classList.add('active')
              }}>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-mustard)] text-[color:var(--color-brown)] px-8 py-4 font-semibold shadow-[0_12px_40px_rgba(253,206,89,0.35)] transition-all hover:shadow-[0_16px_50px_rgba(253,206,89,0.55)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingToCart ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Adding to Cart...
                    </>
                  ) : (
                    <>
                      Add to Cart
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

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

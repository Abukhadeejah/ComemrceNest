"use client"
import { useEffect, useState } from 'react'
import { Playfair_Display } from 'next/font/google'
import type { ProductListItem } from '@/server/modules/products/service'
import Testimonials from '@/components/patterns/Testimonials'
import { bluebellTestimonials } from './testimonialsData'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700','800','900'] })

type HomeClientProps = {
  products: ProductListItem[]
  projects: { id: string; title: string; slug: string; hero_image_url: string | null }[]
}

export default function Home({ products, projects: _projects }: HomeClientProps) {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => setLoaded(true), [])
  // Testimonials grid is static for now; slider removed for modularity

  const heroSlides = [
    {
      url: "https://images.pexels.com/photos/7545787/pexels-photo-7545787.jpeg",
      alt: "Luxury bedroom with premium textiles",
    },
    {
      url: "https://images.pexels.com/photos/6933776/pexels-photo-6933776.jpeg",
      alt: "Dining space with elegant fabric accents",
    },
    {
      url: "https://images.pexels.com/photos/6800942/pexels-photo-6800942.jpeg",
      alt: "Minimal living room with textured upholstery",
    },
  ]

  const [slideIndex, setSlideIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setSlideIndex((i) => (i + 1) % heroSlides.length), 4500)
    return () => clearInterval(id)
  }, [])

  return (
    <main className="p-0">
      {/* Header is provided by layout; remove local navbar duplication */}
      {/* Hero Section */}
      <section id="home" className="hero-gradient min-h-[90vh] flex items-center justify-center relative overflow-hidden">
        {/* Hero carousel */}
        <div className="absolute inset-0">
          {heroSlides.map((s, idx) => (
            <div
              key={s.url}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${slideIndex === idx ? 'opacity-90' : 'opacity-0'}`}
              style={{ backgroundImage: `url('${s.url}')` }}
              aria-label={s.alt}
            />
          ))}
        </div>
        {/* Blue tint overlay for brand cohesion */}
        <div className="pointer-events-none absolute inset-0 [background:linear-gradient(135deg,rgba(1,88,157,0.35),rgba(255,255,255,0)_60%)]" />
        {/* Subtle diagonal texture */}
        <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.1),rgba(255,255,255,0.1)_12px,transparent_12px,transparent_24px)]" />
        {/* Bottom vignette for readability */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/25 via-black/10 to-transparent" />
        {/* Removed placeholder photo overlay that caused rounded window artifact */}
        <div className={`hero-content text-center z-10 px-4`}>
          {/* Logo */}
          <div className="hero-logo mb-8">
            <svg width="220" height="140" viewBox="0 0 220 140" className="mx-auto drop-shadow-2xl animate-[pulse_3s_ease-in-out_infinite]">
              <g transform="translate(110, 25)">
                <defs>
                  <radialGradient id="petalGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style={{ stopColor: 'var(--color-white)', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: 'var(--color-primary)', stopOpacity: 0.8 }} />
                  </radialGradient>
                  <radialGradient id="accentGradient1" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style={{ stopColor: 'var(--color-mustard)', stopOpacity: 0.9 }} />
                    <stop offset="100%" style={{ stopColor: 'var(--color-mustard)', stopOpacity: 0.4 }} />
                  </radialGradient>
                  <radialGradient id="accentGradient2" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style={{ stopColor: 'var(--color-crimson)', stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: 'var(--color-crimson)', stopOpacity: 0.3 }} />
                  </radialGradient>
                </defs>
                <path d="M0 90 Q-25 55 0 20 Q25 55 0 90" fill="url(#petalGradient)" stroke="var(--color-primary)" strokeWidth="2" />
                <path d="M-15 80 Q-35 50 -15 25 Q5 50 -15 80" fill="url(#accentGradient1)" />
                <path d="M15 80 Q35 50 15 25 Q-5 50 15 80" fill="url(#accentGradient2)" />
                <circle cx="0" cy="20" r="10" fill="var(--color-primary)" opacity="0.9" />
                <line x1="0" y1="90" x2="0" y2="110" stroke="var(--color-brown)" strokeWidth="4" />
                <path d="M-20 110 Q0 95 20 110" fill="none" stroke="var(--color-brown)" strokeWidth="3" />
                <circle cx="-30" cy="40" r="3" fill="var(--color-mustard)" opacity="0.6" />
                <circle cx="30" cy="40" r="3" fill="var(--color-crimson)" opacity="0.6" />
                <circle cx="0" cy="10" r="2" fill="var(--color-white)" />
              </g>
            </svg>
          </div>
          <h1 className="hero-title text-5xl md:text-7xl font-serif font-black text-white mb-6 leading-tight">
            Timeless Interiors,
            <br />
            <span className="text-mustard">Beautiful Fabrics</span>
          </h1>
          <p className="hero-subtitle text-lg md:text-xl text-white/90 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
            Discover our curated collection of premium fabrics that transform spaces into extraordinary experiences
          </p>
          <a href="#products" className="inline-flex items-center gap-2 hero-cta bg-mustard text-brown font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl btn-glow">
            Explore Collection
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
          </a>
        </div>
        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSlideIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${slideIndex === idx ? 'bg-white scale-110' : 'bg-white/60 hover:bg-white/80'}`}
            />
          ))}
        </div>
        <div className="absolute top-20 right-20 opacity-20 animate-pulse">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="white" strokeWidth="2" />
            <circle cx="60" cy="60" r="25" fill="var(--color-mustard)" opacity="0.3" />
            <circle cx="60" cy="60" r="10" fill="var(--color-crimson)" opacity="0.5" />
          </svg>
        </div>
        <div className="absolute bottom-32 left-20 opacity-20 animate-bounce [animation-delay:1s]">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <polygon points="40,10 60,30 40,50 20,30" fill="white" opacity="0.4" />
            <polygon points="40,20 50,30 40,40 30,30" fill="var(--color-mustard)" opacity="0.6" />
          </svg>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider bg-white">
        <svg viewBox="0 0 1200 120" className="w-full h-16 fill-white">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-24 bg-gradient-to-br from-white to-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className={`${playfair.className} text-5xl md:text-7xl font-black text-primary mb-4 tracking-tight`}>Our Portfolio</h2>
            <div className="w-20 md:w-28 h-1 bg-mustard mx-auto mb-6"></div>
            <p className="text-brown text-xl md:text-2xl font-normal leading-relaxed max-w-4xl mx-auto">
              Stunning interiors brought to life with our premium fabric collections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {[
              { title: 'Modern Living Room', badge: 'Featured Project', bg: 'from-primary via-blue-600 to-[color:var(--color-mustard)]' },
              { title: 'Luxury Bedroom', badge: 'Luxury Collection', bg: 'from-[color:var(--color-crimson)] via-red-600 to-[color:var(--color-mustard)]' },
              { title: 'Classic Study', badge: 'Classic Design', bg: 'from-[color:var(--color-brown)] via-amber-800 to-[color:var(--color-primary)]' },
            ].map((card, idx) => (
              <div key={card.title} className={`group bg-white rounded-2xl overflow-hidden border border-primary/10 hover:border-mustard/40 shadow-md hover:shadow-lg transition-all duration-700 ease-out hover:-translate-y-1 relative ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${idx===1 ? 'md:mt-10' : ''}`} style={{ transitionDelay: `${idx * 120}ms` }}>
                {/* Light yellow shadow animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-10"></div>
                
                <div className={`h-72 bg-gradient-to-br ${card.bg} relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-15 [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_4px),repeating-linear-gradient(90deg,rgba(0,0,0,0.04)_0px,rgba(0,0,0,0.04)_1px,transparent_1px,transparent_4px)] mix-blend-multiply"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    <div className="flex items-center mb-2">
                      <div className="w-3.5 h-3.5 bg-crimson rounded-full mr-3 animate-pulse"></div>
                      <span className="text-xs font-medium tracking-wider uppercase">{card.badge}</span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold mb-1">{card.title}</h3>
                    <p className="text-white/80 text-sm">Curated selection</p>
                  </div>
                </div>
                <div className="p-8">
                  <p className="text-brown leading-relaxed mb-4">Elegant design featuring our signature collections with luxurious textures and modern appeal.</p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold">View Project</span>
                    <svg className="w-5 h-5 text-mustard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider bg-white">
        <svg viewBox="0 0 1200 120" className="w-full h-20 fill-white rotate-180">
          <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"></path>
        </svg>
      </div>

      {/* Products Section */}
      <section id="products" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className={`${playfair.className} text-5xl md:text-7xl font-black text-primary mb-4 tracking-tight`}>Featured Fabrics</h2>
            <div className="w-20 md:w-28 h-1 bg-mustard mx-auto mb-6"></div>
            <p className="text-brown text-xl md:text-2xl font-normal leading-relaxed max-w-4xl mx-auto">
              Premium quality fabrics for every interior design vision
            </p>
          </div>

          {/* Top Row - Mock Data (Original Design) */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-primary mb-6 text-center">Design Preview (Mock Data)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: 'Ocean Breeze', price: '₹ 6,999', tone: 'from-[color:var(--color-primary)] via-blue-600 to-[color:var(--color-primary)]/70' },
                { title: 'Crimson Velvet', price: '₹ 11,999', tone: 'from-[color:var(--color-crimson)] via-red-600 to-[color:var(--color-crimson)]/70' },
                { title: 'Golden Silk', price: '₹ 15,999', tone: 'from-[color:var(--color-mustard)] via-yellow-400 to-yellow-300' },
                { title: 'Earth Linen', price: '₹ 8,999', tone: 'from-[color:var(--color-brown)] via-amber-800 to-amber-700' },
              ].map((p, idx) => (
                <div key={p.title} className={`group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl border border-primary/20 hover:border-primary transition-all duration-700 ease-out hover:-translate-y-1 hover:scale-[1.02] relative overflow-hidden ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: `${idx * 120}ms` }}>
                  {/* Light yellow shadow animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                  
                  <div className={`product-image h-56 bg-gradient-to-br ${p.tone} rounded-xl mb-6 relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(255,255,255,0.15)_8px,rgba(255,255,255,0.15)_16px)]"></div>
                    <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-mustard/90 shadow-[0_0_0_3px_rgba(255,255,255,0.6)]"></div>
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-xs font-semibold text-primary">Premium</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-primary mb-3">{p.title}</h3>
                  <p className="text-brown mb-6 leading-relaxed">Premium blend with subtle texture and exceptional durability</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-primary">{p.price}</span>
                    <span className="text-sm text-brown">per metre</span>
                  </div>
                  <button className="w-full bg-mustard text-brown font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 btn-glow">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Row - Real Backend Data */}
          <div>
            <h3 className="text-2xl font-bold text-primary mb-6 text-center">Live Products (Backend Data)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.slice(0, 8).map((p, idx) => {
                // Generate dynamic pattern colors based on product characteristics
                const patternColors = [
                  { bg: 'from-[color:var(--color-primary)] via-blue-600 to-[color:var(--color-primary)]/70', accent: 'var(--color-mustard)' },
                  { bg: 'from-[color:var(--color-crimson)] via-red-600 to-[color:var(--color-crimson)]/70', accent: 'var(--color-mustard)' },
                  { bg: 'from-[color:var(--color-mustard)] via-yellow-400 to-yellow-300', accent: 'var(--color-primary)' },
                  { bg: 'from-[color:var(--color-brown)] via-amber-800 to-amber-700', accent: 'var(--color-primary)' },
                  { bg: 'from-emerald-500 via-green-600 to-emerald-400', accent: 'var(--color-mustard)' },
                  { bg: 'from-purple-500 via-indigo-600 to-purple-400', accent: 'var(--color-mustard)' },
                  { bg: 'from-pink-500 via-rose-600 to-pink-400', accent: 'var(--color-primary)' },
                  { bg: 'from-orange-500 via-red-500 to-orange-400', accent: 'var(--color-primary)' },
                ]
                
                const pattern = patternColors[idx % patternColors.length]
                const badgeText = ['Premium', 'Luxury', 'Elegant', 'Natural', 'Exclusive', 'Artisan', 'Heritage', 'Modern'][idx % 8]
                
                return (
                  <a key={p.id} href={`/bluebell/products/${p.slug}`} className={`group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl border border-primary/20 hover:border-primary transition-all duration-700 ease-out hover:-translate-y-1 hover:scale-[1.02] relative overflow-hidden ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: `${idx * 120}ms` }}>
                    {/* Light yellow shadow animation */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                    
                    <div className="product-image h-56 rounded-xl mb-6 relative overflow-hidden">
                      {/* Dynamic Pattern Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${pattern.bg} relative overflow-hidden`}>
                        {/* Diagonal Striped Pattern */}
                        <div className="absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(255,255,255,0.15)_8px,rgba(255,255,255,0.15)_16px)]"></div>
                        
                        {/* Accent Circle */}
                        <div className="absolute top-3 right-3 w-4 h-4 rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.6)]" style={{ backgroundColor: pattern.accent }}></div>
                        
                        {/* Product Image Overlay (if available) */}
                        {p.hero_image_url && (
                          <div className="absolute inset-0 opacity-20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.hero_image_url} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      
                      {/* Badge */}
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                        <span className="text-xs font-semibold text-primary">{badgeText}</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-primary mb-3">{p.name}</h3>
                    <p className="text-brown mb-6 leading-relaxed">{p.description || 'Premium blend with subtle texture and exceptional durability'}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-primary">₹{Math.round((p.price_cents || 0)/100).toLocaleString('en-IN')}</span>
                      <span className="text-sm text-brown">per metre</span>
                    </div>
                    <div className="w-full bg-mustard text-brown text-center font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 btn-glow">
                      View Details
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section (modular) */}
      <div className="section-divider bg-white">
        <svg viewBox="0 0 1200 120" className="w-full h-16 fill-white">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>

      <Testimonials
        title="What Our Clients Say"
        subtitle="Trusted by interior designers and homeowners"
        items={bluebellTestimonials}
      />

      {/* CTA Section */}
      <div className="section-divider bg-white">
        <svg viewBox="0 0 1200 120" className="w-full h-20 fill-white rotate-180">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>

      <section id="contact" className="py-24 bg-gradient-to-br from-primary via-blue-700 to-primary relative overflow-hidden text-white">
        {/* decorative shapes */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-6 top-24 w-6 h-6 rotate-45 bg-white/10 rounded-sm" />
          <div className="absolute right-16 top-20 w-16 h-16 rounded-full bg-white/10 blur-xl" />
          <div className="absolute left-1/2 -translate-x-1/2 top-10 w-1.5 h-6 bg-white/60 rounded-full" />
        </div>
        <div className="max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          {/* headline */}
          <h2 className={`${playfair.className} text-4xl md:text-6xl font-black leading-tight tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)]`}>
            Ready to Transform
            <br />
            <span className="text-mustard">Your Space?</span>
          </h2>
          <p className="mt-4 text-base md:text-xl text-white/90 max-w-4xl mx-auto font-light leading-relaxed">
            Let our expert team help you find the perfect fabrics for your next interior design project. Experience the Bluebell difference today.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-6 justify-center">
            <a className="group inline-flex items-center justify-center bg-mustard text-brown font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 shadow-[0_12px_40px_rgba(253,206,89,0.35)] hover:shadow-[0_16px_50px_rgba(253,206,89,0.55)] hover:-translate-y-0.5" href="#contact">
              Get Free Consultation
              <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
            </a>
            <a className="inline-flex items-center justify-center bg-white/10 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 backdrop-blur-sm shadow-[0_12px_40px_rgba(1,88,157,0.35)] hover:bg-white/20 hover:-translate-y-0.5" href="#products">
              Browse Catalog
            </a>
          </div>

          {/* Contact Info Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="w-12 h-12 bg-mustard rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Call Us</h3>
              <p className="text-white/80">(+91) 98765-43210</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="w-12 h-12 bg-crimson rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Email Us</h3>
              <p className="text-white/80">hello@bluebellFabrics.com</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Visit Us</h3>
              <p className="text-white/80">123 Design Street<br/>New Delhi, 110001</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}











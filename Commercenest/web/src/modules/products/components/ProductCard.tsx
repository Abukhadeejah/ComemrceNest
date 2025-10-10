"use client"
import React from 'react'
import Image from 'next/image'
import { BLUR_DATA_URL } from '@/lib/blurPlaceholder'


type Accent = 'primary' | 'mustard'


type Props = {
  name: string
  priceCents: number
  currency?: string
  imageUrl?: string | null
  badgeText?: string
  accent?: Accent
  description?: string
  whatsappNumber?: string // Add WhatsApp number prop
}


export function ProductCard({ 
  name, 
  imageUrl, 
  badgeText = 'Premium', 
  accent = 'primary', 
  description,
  whatsappNumber = '919876543210' // Default number - replace with actual
}: Props) {
  const accentColor = accent === 'mustard' ? 'var(--color-mustard)' : 'var(--color-primary)'
  
  // WhatsApp link with pre-filled message
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'm interested in ${name}`)}`
  
  return (
    <div
      className="group overflow-hidden rounded-2xl border-[3px] border-transparent bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl relative"
      style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}
    >
      {/* Hover border highlight via overlay with dynamic color */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl border-[3px] opacity-0 transition-opacity group-hover:opacity-100"
        style={{ borderColor: accentColor }}
      />


      {/* Media area with fabric texture overlays */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            priority={false}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <div className="h-full w-full bg-neutral-100" />
        )}
        {/* Fabric texture */}
        <div className="absolute inset-0 opacity-25 [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.12)_0px,rgba(255,255,255,0.12)_8px,transparent_8px,transparent_16px)]" />
        <div className="absolute inset-0 opacity-15 [background:radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.35)_2px,transparent_2px),radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.12)_1px,transparent_1px)] [background-size:18px_18px,14px_14px]" />


        {/* Shimmer on hover */}
        <div className="pointer-events-none absolute -inset-y-1 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_1.8s_linear_infinite]" />


        {/* Badge */}
        <div className="absolute top-3 right-3 rounded-full bg-[color:var(--color-mustard)] px-3 py-1 text-xs font-bold text-[color:var(--color-brown)] shadow-md">
          {badgeText}
        </div>
      </div>


      {/* Content */}
      <div className="p-6">
        <div className="mb-2 text-xl font-bold text-[color:var(--color-primary)]">{name}</div>
        <p className="mb-5 text-[color:var(--color-brown)] text-sm leading-relaxed">
          {description ?? 'Premium blend with subtle texture and exceptional durability'}
        </p>
        
        {/* WhatsApp Button */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-center font-semibold text-white shadow-md transition-all duration-300 hover:bg-[#20BA5A] active:scale-[0.98]"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            className="flex-shrink-0"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Message on WhatsApp
        </a>

        <div className="relative overflow-hidden ripple" onMouseDown={(e) => {
          const target = e.currentTarget as HTMLElement
          const rect = target.getBoundingClientRect()
          target.style.setProperty('--x', `${e.clientX - rect.left}px`)
          target.style.setProperty('--y', `${e.clientY - rect.top}px`)
          target.classList.remove('active')
          // Force reflow to restart animation
          void target.offsetWidth
          target.classList.add('active')
        }}>
          <button type="button" className="w-full select-none rounded-xl bg-[color:var(--color-mustard)] px-5 py-3 text-center font-semibold text-[color:var(--color-brown)] shadow-md transition-transform duration-300 group-hover:brightness-105 active:scale-[0.98]">
            View Details
          </button>
          {/* Ripple pseudo is handled via CSS on parent */}
        </div>
      </div>
    </div>
  )
}

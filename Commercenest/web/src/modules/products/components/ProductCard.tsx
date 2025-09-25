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
}

export function ProductCard({ name, priceCents, imageUrl, badgeText = 'Premium', accent = 'primary', description }: Props) {
  const price = (priceCents / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
  const accentColor = accent === 'mustard' ? 'var(--color-mustard)' : 'var(--color-primary)'
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
        <div className="mb-5 flex items-center justify-between">
          <span className="text-2xl font-extrabold text-[color:var(--color-crimson)]">{price}</span>
          <span className="text-[color:var(--color-brown)] text-sm">per metre</span>
        </div>
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



import React from 'react'

import Image from 'next/image'
import { BLUR_DATA_URL } from '@/lib/blurPlaceholder'

type Props = {
  name: string
  priceCents: number
  currency: string
  imageUrl?: string | null
}

export function ProductCard({ name, priceCents, currency, imageUrl }: Props) {
  const price = (priceCents / 100).toFixed(2)
  return (
    <div className="group rounded-lg border p-4 space-y-2 transition hover:shadow-md">
      {imageUrl ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded">
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            priority={false}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        </div>
      ) : null}
      <div className="font-medium group-hover:text-brand transition-colors">{name}</div>
      <div className="text-sm text-neutral-600">
        {currency} {price}
      </div>
    </div>
  )
}



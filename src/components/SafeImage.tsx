"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageOff } from "lucide-react"

type SafeImageProps = {
  src: string
  alt: string
  sizes: string
  className?: string
  priority?: boolean
}

/**
 * Wraps next/image for this app's three fill-mode product image spots
 * (ProductCard, QuickViewModal, CartLineItem). Falls back to a neutral
 * placeholder — matching the warm storefront palette, not the browser's
 * broken-image icon — for both a missing/empty src and a load failure.
 * Always fills its parent exactly like next/image's `fill` would, so
 * swapping to the placeholder never shifts layout.
 */
export default function SafeImage({ src, alt, sizes, className, priority }: SafeImageProps) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="absolute inset-0 flex items-center justify-center bg-[oklch(0.95_0.008_83)] text-stone-300"
      >
        <ImageOff className="size-6" aria-hidden="true" />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}

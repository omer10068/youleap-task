"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageOff, Loader2 } from "lucide-react"

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
  const [loading, setLoading] = useState(true)

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
    <>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={className}
        onLoad={() => setLoading(false)}
        onError={() => setFailed(true)}
      />
      {/* Sits on top of the image (not behind) so it also covers any
          partially-decoded frame, not just the pre-load gap — removed the
          instant onLoad fires. Callers whose src can change on an already-
          mounted instance (QuickViewModal's gallery) must key by src so
          this state resets per image instead of staying stuck at `false`. */}
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-[oklch(0.95_0.008_83)]"
          aria-hidden="true"
        >
          <Loader2 className="size-6 animate-spin text-stone-300" />
        </div>
      )}
    </>
  )
}

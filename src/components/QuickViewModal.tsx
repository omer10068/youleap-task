"use client"

import { useMemo, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { Check, ChevronLeft, ChevronRight, ShoppingBag, X } from "lucide-react"
import type { Product } from "@/types/product"
import { useCart } from "@/lib/cart-context"
import { useDialog } from "@/lib/use-dialog"
import { formatPrice } from "@/lib/format-price"
import {
  findMatchingVariant,
  getVariantOptionValues,
  isVariantInStock,
} from "@/lib/variant-utils"
import VariantSelector from "@/components/VariantSelector"

type QuickViewModalProps = {
  product: Product
  onClose: () => void
}

const ADDED_CONFIRMATION_MS = 1500

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { dispatch } = useCart()
  const { containerRef, initialFocusRef, handleBackdropClick } =
    useDialog<HTMLDivElement>(onClose)

  // Prefer the first in-stock variant so the modal opens with a real,
  // purchasable selection rather than an empty one the user must resolve.
  const initialVariant = useMemo(
    () => product.variants.find(isVariantInStock) ?? product.variants[0],
    [product]
  )
  const [selection, setSelection] = useState<Record<string, string>>(() =>
    getVariantOptionValues(product, initialVariant)
  )
  const [justAdded, setJustAdded] = useState(false)

  // No product-change reset effect needed: ProductGrid conditionally
  // mounts/unmounts this component per product (never reuses one instance
  // across products), so useState's initial value is already correct on
  // every fresh open.
  const gallery = useMemo(
    () => (product.images.length > 0 ? product.images.map((image) => image.url) : [product.thumbnail]),
    [product]
  )
  const hasMultipleImages = gallery.length > 1
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  function goToImage(index: number) {
    const count = gallery.length
    setSelectedImageIndex(((index % count) + count) % count)
  }

  const matchedVariant = findMatchingVariant(product, selection)
  const inStock = matchedVariant ? isVariantInStock(matchedVariant) : false
  const canAddToCart = Boolean(matchedVariant) && inStock

  function handleSelect(optionId: string, value: string) {
    setSelection((prev) => ({ ...prev, [optionId]: value }))
    setJustAdded(false)
  }

  function handleAddToCart() {
    if (!matchedVariant || !canAddToCart) return

    dispatch({
      type: "ADD_ITEM",
      item: {
        productId: product.id,
        variantId: matchedVariant.id,
        title: product.title,
        variantTitle: matchedVariant.title,
        thumbnail: product.thumbnail,
        unitPrice: matchedVariant.prices[0].amount,
        currencyCode: matchedVariant.prices[0].currency_code,
        quantity: 1,
        availableQuantity: matchedVariant.inventory_quantity,
      },
    })

    setJustAdded(true)
    setTimeout(() => setJustAdded(false), ADDED_CONFIRMATION_MS)
  }

  const formattedPrice = matchedVariant
    ? formatPrice(matchedVariant.prices[0].amount, matchedVariant.prices[0].currency_code)
    : null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        aria-describedby="quick-view-description"
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-[oklch(0.9_0.01_75)] bg-white shadow-[0_40px_80px_-32px_rgba(0,0,0,0.35)] sm:max-h-[88vh] sm:max-w-4xl sm:rounded-3xl"
      >
        {/* Mobile grabber — decorative sheet styling cue. The close button
            below is desktop-only (Escape/backdrop-click cover mobile), so
            initialFocusRef stays on Add to Cart rather than this button —
            a hidden (display:none) element can't receive focus on mobile. */}
        <div className="flex shrink-0 justify-center bg-[oklch(0.95_0.008_83)] py-3 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-[oklch(0.9_0.01_75)]" aria-hidden="true" />
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Quick View"
          className="absolute top-4 right-4 z-10 hidden h-9 w-9 items-center justify-center rounded-full border border-[oklch(0.9_0.01_75)] bg-white/85 text-stone-700 backdrop-blur transition-colors hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 focus-visible:outline-none sm:inline-flex"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto sm:grid-cols-2">
          {/* Gallery */}
          <div className="flex flex-col gap-3 bg-[oklch(0.95_0.008_83)] p-4 sm:p-6">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-[oklch(0.9_0.01_75)]/60 bg-white">
              <Image
                src={gallery[selectedImageIndex]}
                alt={
                  hasMultipleImages
                    ? `${product.title} — image ${selectedImageIndex + 1} of ${gallery.length}`
                    : product.title
                }
                fill
                sizes="(max-width: 640px) 100vw, 40vw"
                className="object-cover"
                priority
              />

              {hasMultipleImages && (
                <>
                  <button
                    type="button"
                    onClick={() => goToImage(selectedImageIndex - 1)}
                    aria-label="Previous image"
                    className="absolute top-1/2 left-3 grid size-7 aspect-square shrink-0 -translate-y-1/2 place-items-center rounded-full bg-white/35 text-stone-600 backdrop-blur-sm transition-colors hover:bg-white/70 hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <ChevronLeft size={14} strokeWidth={2.5} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goToImage(selectedImageIndex + 1)}
                    aria-label="Next image"
                    className="absolute top-1/2 right-3 grid size-7 aspect-square shrink-0 -translate-y-1/2 place-items-center rounded-full bg-white/35 text-stone-600 backdrop-blur-sm transition-colors hover:bg-white/70 hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <ChevronRight size={14} strokeWidth={2.5} aria-hidden="true" />
                  </button>
                  <span
                    className="absolute right-3 bottom-3 rounded-full bg-stone-900/70 px-2.5 py-1 text-xs font-medium text-white tabular-nums backdrop-blur"
                    aria-live="polite"
                  >
                    {selectedImageIndex + 1} / {gallery.length}
                  </span>
                </>
              )}
            </div>

            {hasMultipleImages && (
              <div
                className="flex gap-2"
                role="group"
                aria-label={`Product images, ${gallery.length} total`}
              >
                {gallery.map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => goToImage(index)}
                    aria-label={`View image ${index + 1} of ${gallery.length}`}
                    aria-current={index === selectedImageIndex}
                    className={`relative h-16 w-16 overflow-hidden rounded-xl border transition-colors focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 focus-visible:outline-none ${
                      index === selectedImageIndex
                        ? "border-stone-900"
                        : "border-[oklch(0.9_0.01_75)] hover:border-stone-400"
                    }`}
                  >
                    <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="space-y-3">
              <p className="text-[11px] font-medium tracking-[0.18em] text-[oklch(0.62_0.11_45)] uppercase">
                {product.collection.title}
              </p>
              <h2
                id="quick-view-title"
                className="text-balance text-2xl leading-tight font-semibold text-stone-900 sm:text-3xl"
              >
                {product.title}
              </h2>
              <p
                id="quick-view-description"
                className="text-pretty text-sm leading-relaxed text-stone-500"
              >
                {product.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold text-stone-900">
                {formattedPrice ?? "—"}
              </span>
              <StockPill isMissing={!matchedVariant} inStock={inStock} />
            </div>

            <VariantSelector product={product} selection={selection} onSelect={handleSelect} />

            <div className="mt-auto pt-2">
              <button
                ref={initialFocusRef}
                type="button"
                onClick={handleAddToCart}
                disabled={!canAddToCart}
                aria-live="polite"
                className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 focus-visible:outline-none ${
                  canAddToCart
                    ? "bg-stone-900 text-white hover:bg-stone-700"
                    : "cursor-not-allowed bg-stone-200 text-stone-400"
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Added!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    {!matchedVariant ? "Unavailable" : !inStock ? "Out of stock" : "Add to Cart"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function StockPill({ isMissing, inStock }: { isMissing: boolean; inStock: boolean }) {
  if (isMissing) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-xs font-medium text-stone-500">
        <span className="h-1.5 w-1.5 rounded-full bg-stone-400" aria-hidden="true" />
        Unavailable
      </span>
    )
  }

  if (!inStock) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
        Out of stock
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.62_0.11_45)]/30 bg-[oklch(0.62_0.11_45)]/10 px-3 py-1 text-xs font-medium text-[oklch(0.62_0.11_45)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.62_0.11_45)]" aria-hidden="true" />
      In stock
    </span>
  )
}

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import type { Product } from "@/types/product"
import { useCart } from "@/lib/cart-context"
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

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  )
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { dispatch } = useCart()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

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

  const matchedVariant = findMatchingVariant(product, selection)
  const inStock = matchedVariant ? isVariantInStock(matchedVariant) : false
  const canAddToCart = Boolean(matchedVariant) && inStock

  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
        return
      }

      if (event.key !== "Tab" || !dialogRef.current) return

      const focusable = getFocusableElements(dialogRef.current)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

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
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: matchedVariant.prices[0].currency_code,
      }).format(matchedVariant.prices[0].amount / 100)
    : null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        aria-describedby="quick-view-description"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="quick-view-title" className="text-xl font-bold">
            {product.title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close Quick View"
            className="shrink-0 rounded-md border px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex gap-2 overflow-x-auto sm:flex-col">
            {product.images.map((image, index) => (
              <div key={image.url} className="relative h-40 w-40 shrink-0 sm:h-48 sm:w-full">
                <Image
                  src={image.url}
                  alt={`${product.title} image ${index + 1}`}
                  fill
                  sizes="200px"
                  className="rounded-md object-cover"
                />
              </div>
            ))}
          </div>

          <div>
            <p id="quick-view-description" className="text-sm text-gray-600">
              {product.description}
            </p>

            <div className="mt-4">
              <VariantSelector product={product} selection={selection} onSelect={handleSelect} />
            </div>

            <div className="mt-4 space-y-1">
              <p className="text-lg font-semibold">
                {formattedPrice ?? "Select a valid combination"}
              </p>
              <p className="text-sm">
                {!matchedVariant ? (
                  <span className="text-gray-500">This combination isn&apos;t available.</span>
                ) : inStock ? (
                  <span className="text-green-600">In stock</span>
                ) : (
                  <span className="text-red-600">Out of stock</span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className="mt-4 w-full rounded-md bg-black py-2 text-sm text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {justAdded ? "Added!" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

"use client"

import Image from "next/image"
import { Minus, Plus, X } from "lucide-react"
import type { CartItem } from "@/types/cart"
import { formatPrice } from "@/lib/format-price"

type CartLineItemProps = {
  item: CartItem
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
}

export default function CartLineItem({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: CartLineItemProps) {
  const formatAmount = (amount: number) => formatPrice(amount, item.currencyCode)
  const lineTotal = item.unitPrice * item.quantity

  return (
    <li className="flex gap-4 py-5">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-[oklch(0.9_0.01_75)] bg-[oklch(0.95_0.008_83)]">
        <Image src={item.thumbnail} alt={item.title} fill sizes="80px" className="object-cover" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-stone-900">{item.title}</h3>
            <p className="mt-0.5 text-xs text-stone-500">{item.variantTitle}</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${item.title} (${item.variantTitle}) from cart`}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-1 focus-visible:outline-none"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3">
          <div
            className="inline-flex items-center rounded-full border border-[oklch(0.9_0.01_75)] bg-[oklch(0.985_0.006_83)]"
            role="group"
            aria-label={`Quantity for ${item.title}`}
          >
            <button
              type="button"
              onClick={onDecrement}
              disabled={item.quantity <= 1}
              aria-label={`Decrease quantity of ${item.title} (${item.variantTitle})`}
              className="inline-flex size-8 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
            >
              <Minus className="size-3.5" aria-hidden="true" />
            </button>
            <span className="min-w-8 text-center text-sm font-medium text-stone-900 tabular-nums">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={onIncrement}
              disabled={item.quantity >= item.availableQuantity}
              aria-label={`Increase quantity of ${item.title} (${item.variantTitle})`}
              className="inline-flex size-8 items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
            >
              <Plus className="size-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-stone-900">{formatAmount(lineTotal)}</p>
            {item.quantity > 1 && (
              <p className="text-xs text-stone-400">{formatAmount(item.unitPrice)} each</p>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

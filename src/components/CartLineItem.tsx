"use client"

import Image from "next/image"
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

  return (
    <li className="flex gap-3 py-4">
      <div className="relative h-16 w-16 shrink-0">
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          sizes="64px"
          className="rounded-md object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{item.title}</p>
            <p className="text-xs text-gray-500">{item.variantTitle}</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${item.title} (${item.variantTitle}) from cart`}
            className="shrink-0 text-xs text-gray-400 hover:text-red-600"
          >
            Remove
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDecrement}
              disabled={item.quantity <= 1}
              aria-label={`Decrease quantity of ${item.title} (${item.variantTitle})`}
              className="h-6 w-6 rounded border text-sm disabled:opacity-30"
            >
              −
            </button>
            <span className="w-4 text-center text-sm">{item.quantity}</span>
            <button
              type="button"
              onClick={onIncrement}
              disabled={item.quantity >= item.availableQuantity}
              aria-label={`Increase quantity of ${item.title} (${item.variantTitle})`}
              className="h-6 w-6 rounded border text-sm disabled:opacity-30"
            >
              +
            </button>
          </div>
          <p className="text-sm font-medium">{formatAmount(item.unitPrice * item.quantity)}</p>
        </div>

        <p className="text-xs text-gray-400">{formatAmount(item.unitPrice)} each</p>
      </div>
    </li>
  )
}

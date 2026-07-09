"use client"

import { Check } from "lucide-react"

type CheckoutSuccessProps = {
  itemCount: number
  formattedTotal: string
  onContinueShopping: () => void
}

export default function CheckoutSuccess({
  itemCount,
  formattedTotal,
  onContinueShopping,
}: CheckoutSuccessProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 inline-flex size-16 items-center justify-center rounded-full bg-[oklch(0.62_0.11_45)] text-white">
        <Check className="size-8" aria-hidden="true" />
      </div>
      <p className="mb-2 text-2xl font-semibold text-stone-900">Thank you for your order</p>
      <p aria-live="polite" className="mb-8 max-w-[32ch] text-pretty text-sm leading-relaxed text-stone-500">
        Your order of {itemCount} {itemCount === 1 ? "item" : "items"} totaling{" "}
        <span className="font-medium text-stone-900">{formattedTotal}</span> has been placed.
      </p>
      <button
        type="button"
        onClick={onContinueShopping}
        className="inline-flex w-full max-w-xs items-center justify-center rounded-full bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700 focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Continue shopping
      </button>
    </div>
  )
}

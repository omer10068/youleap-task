"use client"

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
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <p aria-live="polite" className="text-gray-700">
        Thank you! Your order of {itemCount} item{itemCount === 1 ? "" : "s"} (
        {formattedTotal}) has been placed.
      </p>
      <button
        type="button"
        onClick={onContinueShopping}
        className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
      >
        Continue shopping
      </button>
    </div>
  )
}

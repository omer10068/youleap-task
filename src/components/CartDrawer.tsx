"use client"

import { createPortal } from "react-dom"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import { useDialog } from "@/lib/use-dialog"
import CartLineItem from "@/components/CartLineItem"

type CartDrawerProps = {
  onClose: () => void
}

export default function CartDrawer({ onClose }: CartDrawerProps) {
  const { state, dispatch } = useCart()
  const { containerRef, initialFocusRef, handleBackdropClick } =
    useDialog<HTMLDivElement>(onClose)

  const total = state.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const currencyCode = state.items[0]?.currencyCode ?? "ILS"
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(total / 100)

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={handleBackdropClick}>
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="flex h-full w-full max-w-sm flex-col bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between border-b pb-4">
          <h2 id="cart-drawer-title" className="text-lg font-bold">
            Cart
          </h2>
          <button
            ref={initialFocusRef}
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="rounded-md border px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {state.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-gray-600">Your cart is empty.</p>
            <Link href="/products" onClick={onClose} className="text-sm font-medium underline">
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto">
              {state.items.map((item) => (
                <CartLineItem
                  key={item.variantId}
                  item={item}
                  onIncrement={() =>
                    dispatch({
                      type: "UPDATE_QUANTITY",
                      variantId: item.variantId,
                      quantity: item.quantity + 1,
                    })
                  }
                  onDecrement={() =>
                    dispatch({
                      type: "UPDATE_QUANTITY",
                      variantId: item.variantId,
                      quantity: item.quantity - 1,
                    })
                  }
                  onRemove={() => dispatch({ type: "REMOVE_ITEM", variantId: item.variantId })}
                />
              ))}
            </ul>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formattedTotal}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

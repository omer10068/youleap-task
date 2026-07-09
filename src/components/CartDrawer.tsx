"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import { useDialog } from "@/lib/use-dialog"
import CartLineItem from "@/components/CartLineItem"
import CheckoutForm from "@/components/CheckoutForm"
import CheckoutSuccess from "@/components/CheckoutSuccess"

type CartDrawerProps = {
  onClose: () => void
}

type DrawerView = "cart" | "checkout" | "success"

type OrderSummary = {
  itemCount: number
  formattedTotal: string
}

const viewTitles: Record<DrawerView, string> = {
  cart: "Cart",
  checkout: "Checkout",
  success: "Order Confirmed",
}

function formatTotal(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount / 100)
}

export default function CartDrawer({ onClose }: CartDrawerProps) {
  const { state, dispatch } = useCart()
  const { containerRef, initialFocusRef, handleBackdropClick } =
    useDialog<HTMLDivElement>(onClose)

  const [view, setView] = useState<DrawerView>("cart")
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // A checkout view with an empty cart can't happen through normal use (the
  // "Proceed to Checkout" button only exists in the non-empty footer, and
  // the item list/remove buttons aren't rendered during checkout), but this
  // is a cheap, explicit guard against that state rather than trusting it.
  useEffect(() => {
    if (view === "checkout" && state.items.length === 0) {
      setView("cart")
    }
  }, [view, state.items.length])

  // useDialog's focus-in-on-open only fires once, when the dialog first
  // mounts. Switching views swaps content in place rather than opening a
  // new dialog, so each transition needs its own explicit focus shift —
  // otherwise focus is left on a button that just unmounted.
  useEffect(() => {
    if (view === "checkout" || view === "success") {
      headingRef.current?.focus()
    }
  }, [view])

  const total = state.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const currencyCode = state.items[0]?.currencyCode ?? "ILS"
  const formattedTotal = formatTotal(total, currencyCode)

  function handleCheckoutSuccess() {
    const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
    // Captured before CLEAR_CART empties state.items — dispatch doesn't
    // update `state` synchronously, but the summary needs to survive past
    // the point where it would.
    setOrderSummary({ itemCount, formattedTotal })
    dispatch({ type: "CLEAR_CART" })
    setView("success")
  }

  function handleContinueShopping() {
    setView("cart")
    onClose()
  }

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
          <div className="flex items-center gap-2">
            {view === "checkout" && (
              <button
                type="button"
                onClick={() => setView("cart")}
                aria-label="Back to cart"
                className="rounded-md border px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                ←
              </button>
            )}
            <h2
              id="cart-drawer-title"
              ref={headingRef}
              tabIndex={-1}
              className="text-lg font-bold outline-none"
            >
              {viewTitles[view]}
            </h2>
          </div>
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

        {view === "success" && orderSummary && (
          <CheckoutSuccess
            itemCount={orderSummary.itemCount}
            formattedTotal={orderSummary.formattedTotal}
            onContinueShopping={handleContinueShopping}
          />
        )}

        {view === "checkout" && state.items.length > 0 && (
          <CheckoutForm onSuccess={handleCheckoutSuccess} />
        )}

        {view === "cart" &&
          (state.items.length === 0 ? (
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

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formattedTotal}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setView("checkout")}
                  className="w-full rounded-md bg-black py-2 text-sm text-white transition-colors hover:bg-gray-800"
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          ))}
      </div>
    </div>,
    document.body
  )
}

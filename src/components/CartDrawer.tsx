"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Fraunces } from "next/font/google"
import { ArrowLeft, ShoppingBag, X } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useDialog } from "@/lib/use-dialog"
import { formatPrice } from "@/lib/format-price"
import CartLineItem from "@/components/CartLineItem"
import CheckoutForm, { CHECKOUT_FORM_ID } from "@/components/CheckoutForm"
import CheckoutSuccess from "@/components/CheckoutSuccess"

const fraunces = Fraunces({ subsets: ["latin"], weight: ["600"] })

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

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
  const total = state.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const currencyCode = state.items[0]?.currencyCode ?? "ILS"
  const formattedTotal = formatPrice(total, currencyCode)

  function handleCheckoutSuccess() {
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
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
      // Backdrop-click-to-close is suppressed during checkout so an
      // accidental click outside the drawer can't discard an in-progress
      // form — the close button and Back button remain the explicit ways
      // to leave that view.
      onClick={view === "checkout" ? undefined : handleBackdropClick}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className="flex h-full w-full flex-col bg-[oklch(0.998_0.004_83)] shadow-2xl sm:max-w-115"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-[oklch(0.9_0.01_75)]/70 px-5 py-4 sm:px-6">
          {view === "checkout" && (
            <button
              type="button"
              onClick={() => setView("cart")}
              aria-label="Back to cart"
              className="-ml-1 inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-stone-700 transition-colors hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </button>
          )}

          <h2
            id="cart-drawer-title"
            ref={headingRef}
            tabIndex={-1}
            className={`${fraunces.className} text-xl font-semibold tracking-tight text-[oklch(0.22_0.012_60)] outline-none`}
          >
            {viewTitles[view]}
          </h2>

          {view === "cart" && itemCount > 0 && (
            <span className="rounded-full bg-[oklch(0.95_0.008_83)] px-2 py-0.5 text-xs font-medium text-[oklch(0.52_0.014_60)]">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          )}

          <button
            ref={initialFocusRef}
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="ml-auto inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[oklch(0.9_0.01_75)] bg-white text-stone-700 transition-colors hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <X className="size-4" aria-hidden="true" />
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
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <p className="mb-5 text-sm text-stone-500">
                Enter your details to complete this order.
              </p>
              <CheckoutForm onSuccess={handleCheckoutSuccess} />
            </div>

            <div className="shrink-0 border-t border-[oklch(0.9_0.01_75)]/70 bg-[oklch(0.95_0.008_83)]/40 px-5 py-5 sm:px-6">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-sm font-medium text-[oklch(0.52_0.014_60)]">Total</span>
                <span
                  className={`${fraunces.className} text-xl font-semibold text-[oklch(0.22_0.012_60)]`}
                >
                  {formattedTotal}
                </span>
              </div>
              <button
                type="submit"
                form={CHECKOUT_FORM_ID}
                className="inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700 focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Place order
              </button>
            </div>
          </>
        )}

        {view === "cart" &&
          (state.items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-5 inline-flex size-16 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                <ShoppingBag className="size-7" aria-hidden="true" />
              </div>
              <p className="mb-1 text-lg font-medium text-stone-900">Your cart is empty</p>
              <p className="mb-6 max-w-[26ch] text-sm text-stone-500">
                Browse the collection and add something you love.
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border border-[oklch(0.9_0.01_75)] bg-white px-5 py-2.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Browse products
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-5 sm:px-6">
                <ul className="divide-y divide-[oklch(0.9_0.01_75)]/70">
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
                      onRemove={() =>
                        dispatch({ type: "REMOVE_ITEM", variantId: item.variantId })
                      }
                    />
                  ))}
                </ul>
              </div>

              <div className="shrink-0 border-t border-[oklch(0.9_0.01_75)]/70 bg-[oklch(0.95_0.008_83)]/40 px-5 py-5 sm:px-6">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-sm font-medium text-[oklch(0.52_0.014_60)]">Subtotal</span>
                  <span
                    className={`${fraunces.className} text-xl font-semibold text-[oklch(0.22_0.012_60)]`}
                  >
                    {formattedTotal}
                  </span>
                </div>
                <p className="mb-4 text-xs text-[oklch(0.52_0.014_60)]">
                  Shipping and taxes calculated at checkout.
                </p>
                <button
                  type="button"
                  onClick={() => setView("checkout")}
                  className="inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700 focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  Proceed to checkout
                </button>
              </div>
            </>
          ))}
      </div>
    </div>,
    document.body
  )
}

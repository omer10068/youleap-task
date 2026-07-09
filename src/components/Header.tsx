"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Fraunces } from "next/font/google"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import CartDrawer from "@/components/CartDrawer"

const fraunces = Fraunces({ subsets: ["latin"], weight: ["600"] })

export default function Header() {
  const { state } = useCart()
  const itemCount = state.items.reduce((total, item) => total + item.quantity, 0)

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const cartButtonRef = useRef<HTMLButtonElement>(null)

  function handleCloseDrawer() {
    setIsDrawerOpen(false)
    cartButtonRef.current?.focus()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[oklch(0.9_0.01_75)] bg-[oklch(0.985_0.006_83)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-baseline gap-2">
          <span
            className={`${fraunces.className} text-xl font-semibold tracking-tight text-stone-900`}
          >
            Youleap
          </span>
          <span className="text-[11px] font-medium tracking-[0.2em] text-stone-400 uppercase">
            Store
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main">
          <Link
            href="/products"
            className="rounded-full px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Products
          </Link>

          <button
            ref={cartButtonRef}
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
            className={`relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border bg-[oklch(0.998_0.004_83)] text-stone-700 transition-colors hover:bg-stone-50 hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 focus-visible:outline-none ${
              itemCount > 0
                ? "border-[oklch(0.62_0.11_45)]/35"
                : "border-[oklch(0.9_0.01_75)]"
            }`}
          >
            <ShoppingCart className="h-4.5 w-4.5" aria-hidden="true" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[oklch(0.62_0.11_45)] px-1 text-[11px] font-semibold leading-none text-white">
                {itemCount}
              </span>
            )}
          </button>
        </nav>
      </div>
      {isDrawerOpen && <CartDrawer onClose={handleCloseDrawer} />}
    </header>
  )
}

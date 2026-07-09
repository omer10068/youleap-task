"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import CartDrawer from "@/components/CartDrawer"

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
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold">
          Youleap Store
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/products" className="text-sm text-gray-700 hover:text-black">
            Products
          </Link>
          <button
            ref={cartButtonRef}
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
            className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-black"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            <span>{itemCount}</span>
          </button>
        </nav>
      </div>
      {isDrawerOpen && <CartDrawer onClose={handleCloseDrawer} />}
    </header>
  )
}

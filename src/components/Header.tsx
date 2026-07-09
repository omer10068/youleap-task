"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cart-context"

export default function Header() {
  const { state } = useCart()
  const itemCount = state.items.reduce((total, item) => total + item.quantity, 0)

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
          <div
            className="flex items-center gap-1.5 text-sm text-gray-700"
            aria-label={`${itemCount} item${itemCount === 1 ? "" : "s"} in cart`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            <span>{itemCount}</span>
          </div>
        </nav>
      </div>
    </header>
  )
}

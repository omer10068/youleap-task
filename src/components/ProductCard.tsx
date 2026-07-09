"use client"

import Image from "next/image"
import type { Product } from "@/types/product"
import { getStartingPrice } from "@/lib/variant-utils"

type ProductCardProps = {
  product: Product
  onQuickView: (product: Product) => void
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const startingPrice = getStartingPrice(product)
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: startingPrice.currency_code,
  }).format(startingPrice.amount / 100)

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="relative h-64 w-full">
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-medium text-lg">{product.title}</h3>
        <p className="text-gray-600 mt-1">{formattedPrice}</p>
        <button
          onClick={() => onQuickView(product)}
          className="mt-3 w-full rounded-md bg-black py-2 text-white text-sm hover:bg-gray-800 transition-colors"
        >
          Quick View
        </button>
      </div>
    </div>
  )
}

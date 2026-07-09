"use client"

import Image from "next/image"
import { Fraunces } from "next/font/google"
import type { Product } from "@/types/product"
import { getStartingPrice } from "@/lib/variant-utils"
import { formatPrice } from "@/lib/format-price"

const fraunces = Fraunces({ subsets: ["latin"], weight: ["500", "600"] })

type ProductCardProps = {
  product: Product
  onQuickView: (product: Product, trigger: HTMLButtonElement) => void
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const startingPrice = getStartingPrice(product)
  const formattedPrice = formatPrice(startingPrice.amount, startingPrice.currency_code)

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-[oklch(0.9_0.01_75)] bg-[oklch(0.998_0.004_83)] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[oklch(0.22_0.012_60)]/15 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)]">
      <div className="relative aspect-square w-full overflow-hidden bg-[oklch(0.95_0.008_83)]">
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-1 flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[oklch(0.52_0.014_60)]">
            {product.collection.title}
          </p>
          <h3
            className={`${fraunces.className} text-pretty text-lg leading-snug font-medium text-[oklch(0.22_0.012_60)]`}
          >
            {product.title}
          </h3>
          <p className="text-base font-semibold text-[oklch(0.22_0.012_60)]">{formattedPrice}</p>
        </div>
        <button
          // Pass the exact clicked element rather than reading
          // document.activeElement inside the handler — Safari/Firefox
          // don't always focus a button on click, so activeElement isn't
          // reliably the trigger. This lets the modal return focus here
          // precisely, regardless of that browser quirk.
          onClick={(event) => onQuickView(product, event.currentTarget)}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[oklch(0.26_0.014_55)] px-4 text-sm font-medium text-[oklch(0.98_0.006_83)] transition-colors hover:bg-[oklch(0.62_0.11_45)] hover:text-[oklch(0.99_0.006_83)] focus-visible:ring-2 focus-visible:ring-[oklch(0.62_0.11_45)] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Quick View
        </button>
      </div>
    </div>
  )
}

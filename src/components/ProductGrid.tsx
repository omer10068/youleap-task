"use client"

import { useRef, useState } from "react"
import { PackageSearch } from "lucide-react"
import type { Product } from "@/types/product"
import ProductCard from "@/components/ProductCard"
import QuickViewModal from "@/components/QuickViewModal"

/**
 * Server Components can't pass event handler props to Client Components
 * (functions aren't serializable across that boundary). This component
 * receives only plain, serializable `products` data from the Server
 * Component page and owns the Quick View click handler itself.
 */
type ProductGridProps = {
  products: Product[]
  emptyMessage?: string
}

export default function ProductGrid({
  products,
  emptyMessage = "No products found.",
}: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  function handleQuickView(product: Product, trigger: HTMLButtonElement) {
    triggerRef.current = trigger
    setSelectedProduct(product)
  }

  function handleCloseQuickView() {
    setSelectedProduct(null)
    triggerRef.current?.focus()
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-20 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
          <PackageSearch className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-stone-900">{emptyMessage}</h3>
          <p className="mx-auto max-w-sm text-sm text-stone-500">
            Try adjusting your search or clearing the active filters.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onQuickView={handleQuickView} />
        ))}
      </div>
      {selectedProduct && (
        <QuickViewModal product={selectedProduct} onClose={handleCloseQuickView} />
      )}
    </>
  )
}

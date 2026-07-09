"use client"

import type { Product } from "@/types/product"
import ProductCard from "@/components/ProductCard"

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
  function handleQuickView(product: Product) {
    // A future phase will open the Quick View modal here.
    console.log("Quick View requested for:", product.id)
  }

  if (products.length === 0) {
    return <p className="text-gray-600">{emptyMessage}</p>
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onQuickView={handleQuickView} />
      ))}
    </div>
  )
}

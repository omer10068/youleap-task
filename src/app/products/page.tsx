import { getBaseUrl } from "@/lib/get-base-url"
import ProductGrid from "@/components/ProductGrid"
import type { ProductsResponse } from "@/types/product"

export default async function ProductsPage() {
  const baseUrl = await getBaseUrl()
  const res = await fetch(`${baseUrl}/api/products`, { cache: "no-store" })

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status}`)
  }

  const data: ProductsResponse = await res.json()

  return (
    <main className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <ProductGrid products={data.products} />
    </main>
  )
}

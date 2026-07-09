import { getBaseUrl } from "@/lib/get-base-url"
import {
  PRODUCTS_PAGE_SIZE,
  buildApiSearchParams,
  parseProductQueryParams,
} from "@/lib/query-params"
import ProductFilters from "@/components/ProductFilters"
import ProductGrid from "@/components/ProductGrid"
import type { Product, ProductCollection, ProductsResponse } from "@/types/product"

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function deriveCollections(products: Product[]): ProductCollection[] {
  const byHandle = new Map<string, ProductCollection>()
  for (const product of products) {
    byHandle.set(product.collection.handle, product.collection)
  }
  return Array.from(byHandle.values()).sort((a, b) => a.title.localeCompare(b.title))
}

function deriveTags(products: Product[]): string[] {
  const tags = new Set<string>()
  for (const product of products) {
    for (const tag of product.tags) tags.add(tag.value)
  }
  return Array.from(tags).sort()
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const rawSearchParams = await searchParams
  const parsed = parseProductQueryParams(rawSearchParams)
  const baseUrl = await getBaseUrl()

  // Run in parallel: sequentially these are two ~200-500ms mock-latency
  // requests, which would add up to a full second of load time.
  const [gridRes, catalogRes] = await Promise.all([
    fetch(`${baseUrl}/api/products?${buildApiSearchParams(parsed)}`, {
      cache: "no-store",
    }),
    // Filter options (collections/tags) don't depend on searchParams and
    // are effectively static for the session, so this one is cached
    // instead of no-store — no need to re-pay the mock latency on every
    // search keystroke or filter click just to redraw the same chip list.
    fetch(`${baseUrl}/api/products?limit=100`, { next: { revalidate: 60 } }),
  ])

  if (!gridRes.ok) {
    throw new Error(`Failed to fetch products: ${gridRes.status}`)
  }
  if (!catalogRes.ok) {
    throw new Error(`Failed to fetch product catalog: ${catalogRes.status}`)
  }

  const gridData: ProductsResponse = await gridRes.json()
  const catalogData: ProductsResponse = await catalogRes.json()

  const collections = deriveCollections(catalogData.products)
  const tags = deriveTags(catalogData.products)
  const totalPages = Math.max(1, Math.ceil(gridData.count / PRODUCTS_PAGE_SIZE))
  const hasActiveFilters = Boolean(parsed.q || parsed.collection || parsed.tag)

  return (
    <main className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <ProductFilters
        collections={collections}
        tags={tags}
        current={parsed}
        totalPages={totalPages}
      />
      <div className="mt-6">
        <ProductGrid
          products={gridData.products}
          emptyMessage={
            hasActiveFilters ? "No products match your filters." : "No products found."
          }
        />
      </div>
    </main>
  )
}

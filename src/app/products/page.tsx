import { Fraunces } from "next/font/google"
import { getBaseUrl } from "@/lib/get-base-url"
import {
  PRODUCTS_PAGE_SIZE,
  buildApiSearchParams,
  parseProductQueryParams,
} from "@/lib/query-params"
import ProductFilters from "@/components/ProductFilters"
import ProductGrid from "@/components/ProductGrid"
import ProductPagination from "@/components/ProductPagination"
import type { Product, ProductCollection, ProductsResponse } from "@/types/product"

const fraunces = Fraunces({ subsets: ["latin"], weight: ["600"] })

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
    <main className="min-h-screen bg-[oklch(0.985_0.006_83)]">
      <div className="mx-auto max-w-7xl px-4 pt-10 pb-20 sm:px-6 sm:pt-14 lg:px-8">
        <section className="border-b border-[oklch(0.9_0.01_75)] pb-10 sm:pb-14">
          <p className="text-xs font-medium tracking-[0.22em] text-[oklch(0.62_0.11_45)] uppercase">
            The Collection
          </p>
          <h1
            className={`${fraunces.className} mt-3 text-4xl font-semibold text-balance tracking-tight text-stone-900 sm:text-5xl`}
          >
            Premium everyday essentials
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-stone-500">
            Thoughtfully designed products for work, home, and life — crafted from
            considered materials and built to last. Explore the pieces our community
            loves most.
          </p>
        </section>

        <section className="py-8">
          <ProductFilters collections={collections} tags={tags} current={parsed} />
        </section>

        <div className="flex items-center justify-between pb-5">
          <p className="text-sm text-stone-500">
            <span className="font-semibold text-stone-900">{gridData.count}</span>{" "}
            {gridData.count === 1 ? "product" : "products"}
          </p>
        </div>

        <ProductGrid
          products={gridData.products}
          emptyMessage={
            hasActiveFilters ? "No products match your filters." : "No products found."
          }
        />

        <ProductPagination page={parsed.page} totalPages={totalPages} />
      </div>
    </main>
  )
}

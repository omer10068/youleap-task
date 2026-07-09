"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X, ChevronDown } from "lucide-react"
import type { ProductCollection } from "@/types/product"
import type { ProductQueryParams } from "@/lib/query-params"

const SEARCH_DEBOUNCE_MS = 350

type ProductFiltersProps = {
  collections: ProductCollection[]
  tags: string[]
  current: ProductQueryParams
}

export default function ProductFilters({ collections, tags, current }: ProductFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(current.q ?? "")

  // Any filter/search change resets to page 1 by omitting "page" entirely.
  const updateFilters = useCallback(
    (updates: { q?: string; collection?: string; tag?: string }) => {
      const params = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }

      params.delete("page")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, pathname, router]
  )

  useEffect(() => {
    if (searchValue === (current.q ?? "")) return

    const timeout = setTimeout(() => {
      updateFilters({ q: searchValue || undefined })
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [searchValue, current.q, updateFilters])

  const hasActiveFilters = Boolean(current.q || current.collection || current.tag)

  function clearAllFilters() {
    setSearchValue("")
    updateFilters({ q: undefined, collection: undefined, tag: undefined })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-stone-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="h-12 w-full rounded-full border border-stone-300 bg-white pl-11 pr-11 text-sm text-stone-900 shadow-sm outline-none transition-colors placeholder:text-stone-400 focus-visible:border-stone-500 focus-visible:ring-2 focus-visible:ring-stone-900/10"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="relative sm:w-56">
          <select
            value={current.tag ?? ""}
            onChange={(e) => updateFilters({ tag: e.target.value || undefined })}
            aria-label="Filter by tag"
            className="h-12 w-full appearance-none rounded-full border border-stone-300 bg-white pl-4 pr-10 text-sm text-stone-900 shadow-sm outline-none transition-colors focus-visible:border-stone-500 focus-visible:ring-2 focus-visible:ring-stone-900/10"
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => updateFilters({ collection: undefined })}
          aria-pressed={!current.collection}
          className={`inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 ${
            !current.collection
              ? "border-stone-900 bg-stone-900 text-white"
              : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
          }`}
        >
          All
        </button>
        {collections.map((collection) => (
          <button
            key={collection.id}
            type="button"
            onClick={() => updateFilters({ collection: collection.handle })}
            aria-pressed={current.collection === collection.handle}
            className={`inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 ${
              current.collection === collection.handle
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:border-stone-400"
            }`}
          >
            {collection.title}
          </button>
        ))}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

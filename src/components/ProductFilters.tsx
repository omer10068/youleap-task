"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ProductCollection } from "@/types/product"
import type { ProductQueryParams } from "@/lib/query-params"

const SEARCH_DEBOUNCE_MS = 350

type ProductFiltersProps = {
  collections: ProductCollection[]
  tags: string[]
  current: ProductQueryParams
  totalPages: number
}

export default function ProductFilters({
  collections,
  tags,
  current,
  totalPages,
}: ProductFiltersProps) {
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

  // Pagination uses push (not replace) so browser Back returns to the
  // previous page, per the agreed tradeoff for this control specifically.
  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString())

      if (page <= 1) {
        params.delete("page")
      } else {
        params.set("page", String(page))
      }

      router.push(`${pathname}?${params.toString()}`)
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="w-64 rounded-md border px-3 py-2 text-sm"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
          )}
        </div>

        <select
          value={current.tag ?? ""}
          onChange={(e) => updateFilters({ tag: e.target.value || undefined })}
          aria-label="Filter by tag"
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-sm text-gray-600 underline hover:text-black"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateFilters({ collection: undefined })}
          aria-pressed={!current.collection}
          className={`rounded-full border px-3 py-1 text-sm ${
            !current.collection ? "bg-black text-white" : "bg-white text-gray-700"
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
            className={`rounded-full border px-3 py-1 text-sm ${
              current.collection === collection.handle
                ? "bg-black text-white"
                : "bg-white text-gray-700"
            }`}
          >
            {collection.title}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <button
          type="button"
          onClick={() => goToPage(current.page - 1)}
          disabled={current.page <= 1}
          className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {current.page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => goToPage(current.page + 1)}
          disabled={current.page >= totalPages}
          className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}

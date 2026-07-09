"use client"

import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

type ProductPaginationProps = {
  page: number
  totalPages: number
}

export default function ProductPagination({ page, totalPages }: ProductPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Extracted verbatim from ProductFilters' previous goToPage — same URL
  // logic, same router.push (not replace, so Back steps through pages),
  // just relocated so it can render below the grid instead of above it.
  const goToPage = useCallback(
    (targetPage: number) => {
      const params = new URLSearchParams(searchParams.toString())

      if (targetPage <= 1) {
        params.delete("page")
      } else {
        params.set("page", String(targetPage))
      }

      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router]
  )

  if (totalPages <= 1) return null

  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <nav aria-label="Pagination" className="mt-10 border-t border-stone-200 pt-6">
      {/* Desktop: Previous / Page X of Y / Next, below the grid */}
      <div className="hidden items-center justify-between sm:flex">
        <button
          type="button"
          onClick={() => goToPage(page - 1)}
          disabled={!hasPrev}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-stone-300 bg-white px-5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-stone-300 disabled:hover:text-stone-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </button>

        <p className="text-sm text-stone-500">
          Page <span className="font-semibold text-stone-900">{page}</span> of{" "}
          <span className="font-semibold text-stone-900">{totalPages}</span>
        </p>

        <button
          type="button"
          onClick={() => goToPage(page + 1)}
          disabled={!hasNext}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-stone-300 bg-white px-5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-stone-300 disabled:hover:text-stone-700"
        >
          Next
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile: full-width "Next products" action, still ordinary page
          navigation via the same goToPage/router.push — not accumulated
          Load More. */}
      <div className="flex flex-col gap-3 sm:hidden">
        <p className="text-center text-sm text-stone-500">
          Page <span className="font-semibold text-stone-900">{page}</span> of{" "}
          <span className="font-semibold text-stone-900">{totalPages}</span>
        </p>
        <button
          type="button"
          onClick={() => goToPage(page + 1)}
          disabled={!hasNext}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 text-sm font-medium text-white transition-colors hover:bg-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          Next products
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => goToPage(page - 1)}
          disabled={!hasPrev}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Previous products
        </button>
      </div>
    </nav>
  )
}

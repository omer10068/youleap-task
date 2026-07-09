export const PRODUCTS_PAGE_SIZE = 12

export type ProductQueryParams = {
  q?: string
  collection?: string
  tag?: string
  page: number
}

type RawSearchParams = Record<string, string | string[] | undefined>

/**
 * A URL param can legally repeat (?tag=a&tag=b), giving Next's searchParams
 * a string[] for that key. The API only accepts a single value, so this
 * always takes the first occurrence and treats a blank string as absent.
 */
function getSingleParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  const trimmed = raw?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * Guards against the API's NaN footgun: Number("abc") is NaN, and
 * slice(NaN, NaN) silently returns []. Anything non-numeric, non-integer,
 * or less than 1 falls back to page 1 instead of reaching the fetch.
 */
function parsePage(value: string | string[] | undefined): number {
  const raw = getSingleParam(value)
  if (!raw) return 1

  const page = Number(raw)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

export function parseProductQueryParams(searchParams: RawSearchParams): ProductQueryParams {
  return {
    q: getSingleParam(searchParams.q),
    collection: getSingleParam(searchParams.collection),
    tag: getSingleParam(searchParams.tag),
    page: parsePage(searchParams.page),
  }
}

export function getOffset(page: number): number {
  return (page - 1) * PRODUCTS_PAGE_SIZE
}

export function buildApiSearchParams(params: ProductQueryParams): URLSearchParams {
  const searchParams = new URLSearchParams()

  if (params.q) searchParams.set("q", params.q)
  if (params.collection) searchParams.set("collection", params.collection)
  if (params.tag) searchParams.set("tag", params.tag)

  searchParams.set("limit", String(PRODUCTS_PAGE_SIZE))
  searchParams.set("offset", String(getOffset(params.page)))

  return searchParams
}

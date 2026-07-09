import { headers } from "next/headers"

/**
 * Server Components can't fetch relative URLs (there's no implicit host,
 * unlike a browser fetch). Deriving the origin from the incoming request's
 * headers avoids hardcoding localhost:3000, so this works unmodified in any
 * deployment without extra env configuration.
 */
export async function getBaseUrl(): Promise<string> {
  const headersList = await headers()
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto") ?? "http"

  if (!host) {
    throw new Error("Unable to determine request host for server-side fetch")
  }

  return `${protocol}://${host}`
}

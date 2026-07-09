/**
 * Amounts are stored in minor units (agorot) across this app — 29900 means
 * ₪299.00. Every existing call site already did exactly this division and
 * Intl.NumberFormat call independently (ProductCard, QuickViewModal,
 * CartLineItem, CartDrawer); this just gives them one shared source.
 */
export function formatPrice(amount: number, currencyCode = "ILS"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount / 100)
}

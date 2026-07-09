import type { Price, Product, ProductVariant } from "@/types/product"

/**
 * The mock API has no structural link between a variant and its option
 * values (no `variant.options` map). In practice `variant.title` is the
 * option values joined with " - " in the same order as `product.options` —
 * except prod_14, whose titles ("EU 42 - Black") carry a trailing "Black"
 * segment that isn't modeled as an option at all. So only the first
 * `options.length` segments are treated as option values; any extra
 * trailing segments are ignored. This is an inferred convention, not a
 * documented contract, so parsing here must fail safe rather than throw.
 */
const VARIANT_TITLE_SEPARATOR = " - "

export function getStartingPrice(product: Product): Price {
  return product.variants.reduce<Price>((cheapest, variant) => {
    const price = variant.prices[0]
    return price.amount < cheapest.amount ? price : cheapest
  }, product.variants[0].prices[0])
}

export function getVariantOptionValues(
  product: Product,
  variant: ProductVariant
): Record<string, string> {
  const values = variant.title.split(VARIANT_TITLE_SEPARATOR)

  if (values.length < product.options.length) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[variant-utils] Could not parse variant "${variant.id}" title ` +
          `"${variant.title}" against ${product.options.length} option(s) ` +
          `on product "${product.id}".`
      )
    }
    return {}
  }

  return product.options.reduce<Record<string, string>>((result, option, index) => {
    result[option.id] = values[index]
    return result
  }, {})
}

export function findMatchingVariant(
  product: Product,
  selection: Record<string, string>
): ProductVariant | undefined {
  return product.variants.find((variant) => {
    const optionValues = getVariantOptionValues(product, variant)
    return product.options.every(
      (option) => optionValues[option.id] === selection[option.id]
    )
  })
}

export function isVariantInStock(variant: ProductVariant): boolean {
  return variant.inventory_quantity > 0
}

/**
 * Returns the values of `optionId` for which at least one variant exists,
 * given the options already chosen in `selection`. Options not yet present
 * in `selection` (e.g. nothing picked yet) are treated as wildcards rather
 * than hard constraints, so this works both before any option is chosen and
 * once a partial selection narrows it down. Reflects whether a combination
 * exists at all (e.g. prod_20's missing King/Slate combination), not
 * whether it's in stock — see `isVariantInStock`.
 */
export function getAvailableOptionValues(
  product: Product,
  selection: Record<string, string>,
  optionId: string
): string[] {
  const option = product.options.find((o) => o.id === optionId)
  if (!option) return []

  const constrainingOptions = product.options.filter(
    (o) => o.id !== optionId && selection[o.id] !== undefined
  )
  const available = new Set<string>()

  for (const variant of product.variants) {
    const optionValues = getVariantOptionValues(product, variant)
    const matchesSelection = constrainingOptions.every(
      (o) => optionValues[o.id] === selection[o.id]
    )
    if (matchesSelection && optionValues[optionId]) {
      available.add(optionValues[optionId])
    }
  }

  return option.values.filter((value) => available.has(value))
}

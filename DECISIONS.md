# Decisions

This file is a running log, updated as the project progresses. This first entry covers
only the domain-foundation phase: `src/types/cart.ts`, `src/lib/variant-utils.ts`, and
`src/lib/cart-context.tsx`. No UI exists yet and the cart provider is not wired into
`layout.tsx`.

## Cart snapshot model

`CartItem` (`src/types/cart.ts`) stores a denormalized snapshot — `productId`,
`variantId`, `title`, `variantTitle`, `thumbnail`, `unitPrice`, `currencyCode`,
`quantity`, `availableQuantity` — rather than just IDs. This lets the (future) cart
drawer render and validate quantity without re-fetching or re-deriving product data,
and gives the reducer a `availableQuantity` ceiling to clamp against without a second
lookup.

## Cart item identity = `variantId`

Two variants of the same product are different purchasable things (different price,
different stock), so they're different cart lines. Line items are matched and merged
by `variantId`, not `productId`.

## State management: React Context + `useReducer`

The cart is small, local-only, single-tab. No Redux/Zustand/React Query — unjustified
weight for this scope. The reducer supports exactly four actions: `ADD_ITEM`,
`REMOVE_ITEM`, `UPDATE_QUANTITY`, `CLEAR_CART`. `ADD_ITEM` merges into an existing line
by `variantId` (increments quantity) instead of duplicating it. Both `ADD_ITEM` and
`UPDATE_QUANTITY` clamp quantity to `[1, availableQuantity]` — quantity can't go
negative or exceed known stock. Specifically, `UPDATE_QUANTITY` clamps any quantity
below 1 up to 1 — it never removes the line item, even if the caller passes `0` or a
negative number. Removal is always an explicit, separate `REMOVE_ITEM` action, never an
implicit side effect of setting quantity to 0.

## No `localStorage` yet

Persistence is deferred to whichever phase actually mounts `CartProvider` in the tree.
Reading/writing `localStorage` before there's a mounted provider can't be verified
end-to-end, and the reducer needs to stay storage-agnostic and side-effect-free at this
stage. Persistence will be added as a thin effect wrapper around the existing reducer,
not a redesign of it.

## Variant → option resolution: inferred from `variant.title`

The `Product`/`ProductVariant` types have no structural link between a variant and its
option values (no `variant.options` map). In this dataset, `variant.title` is the
option values joined with `" - "` in the same order as `product.options`
(e.g. `"500ml - White"` for `Size` then `Color`). This is an inferred convention, not a
documented contract, so `getVariantOptionValues` parses positionally and fails safe
(returns `{}`, with a dev-only console warning) instead of throwing if a title can't be
parsed against the product's declared options. See **Surprises** below for a real case
this had to accommodate.

## Selection keyed by `option.id`, not option title

Titles are unique per product in this dataset, but `id` is the schema's actual stable
identifier for an option, so selection state (`Record<optionId, value>`) uses that.

## Starting price = minimum variant price

`getStartingPrice` returns the full `Price` object (`{amount, currency_code}`) from the
cheapest variant, not `variants[0]`. In the current mock data the first variant always
happens to be cheapest, but that's incidental to authoring order, not a guarantee —
deriving the true minimum is the only definition that isn't coincidentally correct.
Returning the full `Price` object (not a bare number) avoids hardcoding `"ILS"`
elsewhere.

## Incomplete option combinations handled safely

`prod_20` (Linen Bedding Set) declares `Size × Color` = 4 possible combinations but
only has 3 variants — King/Slate doesn't exist. `findMatchingVariant` returns
`undefined` for both this case and any incomplete selection, rather than throwing.
`getAvailableOptionValues` lets a future variant selector disable the missing value
(e.g. grey out "Slate" once "King" is picked) by returning only the values that have at
least one matching variant, given whatever's been selected so far. Options not yet
selected are treated as wildcards (not hard constraints), so it also works before the
user has picked anything — e.g. asking "which sizes exist at all" with no color chosen
yet.

## Verification

No test framework was added (out of scope for this phase). Verified with a disposable
script (not committed) that compiled the two `lib` files with the project's own
TypeScript compiler and ran them against the real `mock-data/products.json` — not
hand-picked fixtures. It covers: `getStartingPrice` picking the true minimum,
`getVariantOptionValues` parsing single- and multi-option titles, `findMatchingVariant`
resolving `prod_20`'s existing King/Oatmeal combo and correctly returning `undefined`
for the missing King/Slate combo and for incomplete selections, `isVariantInStock`
against `prod_01`'s out-of-stock Navy Blue variant, `getAvailableOptionValues`'s
wildcard behavior, and the cart reducer's merge/clamp/remove/clear behavior. It also
swept all 26 products end-to-end and asserted zero unparseable variants. `pnpm
typecheck` and `pnpm lint` are clean on all three new files (no `any`).

## Surprises

- No structural `variant → option` link in the data at all — had to infer the
  `" - "`-join convention from `product.options` order, which is why
  `getVariantOptionValues` treats it as fail-safe rather than trusted.
- `prod_20` has an incomplete Size×Color cartesian product (3 of 4 combinations).
- `prod_14` (Running Shoes) declares a single `Size` option, but its variant titles are
  `"EU 42 - Black"`, `"EU 43 - Black"`, `"EU 44 - Black"` — an extra "Black" segment
  that isn't modeled as an option anywhere. A strict "segment count must exactly equal
  option count" parser (my first version) silently blanked out all option data for this
  product — it didn't crash, but it also never matched a variant, which would have
  quietly broken the variant selector for one of the 26 products. Caught by running the
  parser over the full dataset rather than a handful of examples. Fixed by taking only
  the first `options.length` segments and ignoring extra trailing ones; still fails
  safe if a title has *fewer* segments than declared options.

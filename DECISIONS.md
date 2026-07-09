# Decisions

This file is a running log, updated as the project progresses.

## Phase 1 — Domain foundation

Covers `src/types/cart.ts`, `src/lib/variant-utils.ts`, and `src/lib/cart-context.tsx`.
No UI existed yet and the cart provider was not wired into `layout.tsx`.

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

## Phase 2 — App shell & typed products foundation

Wires the cart provider into the app, adds a minimal header, and converts `/products`
to a typed Server Component fetch. Still no Quick View modal, cart drawer,
search/filter, pagination, checkout, or `localStorage`.

### `/products` is now a Server Component

`src/app/products/page.tsx` is an `async` Server Component that fetches
`GET /api/products` directly (no `mock-data` import, no query params yet) and renders
`<ProductGrid products={data.products} />`. Doing this now rather than in the
search/filter phase avoids typing the old client `useEffect` fetch just to throw it
away next phase — the fetch shape doesn't change when `searchParams` support is added
later, only what's passed as query params.

### Base URL strategy for server-side fetches

A Server Component `fetch` needs an absolute URL — there's no implicit host like in a
browser `fetch("/api/products")`. `src/lib/get-base-url.ts` derives the origin from the
incoming request's `host`/`x-forwarded-host` and protocol headers via `next/headers`'s
`headers()` (async in this Next version, consistent with the async `params` pattern
already used in `src/app/api/products/[id]/route.ts`). This avoids hardcoding
`http://localhost:3000`, so it works unmodified in dev and in any deployment without
extra env configuration. Deliberately not bypassed by importing `mock-data/` directly
in the page — the README specifies fetching from `GET /api/products`, and skipping the
HTTP layer for SSR would mean never actually exercising that API route from the app.

### The Server → Client event handler boundary

`onQuickView` is a function, and functions aren't serializable across the Server → Client
boundary — a Server Component can't pass one as a prop to a Client Component. `/products/page.tsx`
stays a Server Component and passes only plain, serializable `products: Product[]` down
to a new `src/components/ProductGrid.tsx`, which is `"use client"` and owns the Quick
View click handler itself (currently just `console.log`s the clicked product; Phase 3
replaces that body with opening the modal). `ProductCard` also stays a client component
— it needs an `onClick` handler regardless of where its state lives, so there's no
Server/Client split to make inside the card itself.

### `Header` as a Client Component

`Header` calls `useCart()` to render the item count, which forces it to be
`"use client"` — there's no way around this short of splitting out a separate tiny
client-only "cart badge," which isn't worth it for a component this small. The cart
icon/count is deliberately **not** a clickable link yet: there's no drawer to open, and
making it look actionable when it does nothing would be a misleading affordance. It
becomes interactive in the cart-drawer phase.

### `CartProvider` wired now, `localStorage` still deferred

The provider is mounted in `layout.tsx` now because `Header` requires it structurally.
That's a different question from whether to add persistence, though: there is still no
real Add-to-Cart flow to populate the cart, reload, and confirm state survives, so
`localStorage` would be shipped unverified against actual usage. It's deferred again,
to whichever phase adds Add to Cart. This also avoids an SSR/hydration-mismatch risk
for free right now: with no persistence, `CartProvider`'s initial state (`{items: []}`)
is identical on server and client, so there's nothing to reconcile after hydration.
Adding persistence introduces that mismatch risk and needs explicit handling for it —
better taken on once there's a real flow to test it against.

### Verification for this phase

Typecheck and lint are clean across the whole repo (not just the new/changed files —
the pre-existing `any`/`no-img-element` warnings on the old `ProductCard` and
`products/page.tsx` are gone now that both were rewritten). Verified against the
project's own running dev server rather than only static analysis: `GET /products`
returns 200 with real SSR product data, exactly 12 `Quick View` buttons (matching the
API's default `limit=12`), prices correctly formatted with the `₪` symbol via
`Intl.NumberFormat` and each variant's real `currency_code`, `next/image` genuinely
optimizing thumbnails through `/_next/image` (confirming the `picsum.photos`
`remotePatterns` entry in `next.config.mjs` wasn't dead configuration), and real `alt`
text present per product. Not verified: an actual browser click on "Quick View" (no
browser-automation tool available in this environment) — the handler wiring is a single
`onClick={() => onQuickView(product)}` line, so this is a low-risk gap, not a deferred
one.

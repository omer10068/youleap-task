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

## Phase 3 — Search, filter, and pagination

Adds URL-driven search, collection/tag filtering, and pagination to `/products`. Still
no Quick View modal, cart drawer, checkout, or `localStorage`.

### Two server-side fetches per page load

`src/app/products/page.tsx` makes two fetches in parallel (`Promise.all`, not
sequential — sequentially these are two ~200-500ms mock-latency requests, which would
add up to a full second): one filtered/paginated fetch for the grid
(`cache: "no-store"`, since it must reflect the current `q`/`collection`/`tag`/`page`
exactly), and one broad fetch (`GET /api/products?limit=100`) to derive the actual set
of collections and tags in use, cached with `{ next: { revalidate: 60 } }` since it
doesn't depend on `searchParams` and is effectively static for the session — no reason
to re-pay the mock latency on every keystroke just to redraw the same chip list.
Deliberately not hardcoded from `openapi.json`: its documented tag enum (16 values) is
stale against the real mock data (22 values in actual use — `footwear`, `decor`,
`photography`, `equipment`, `leather`, `wellness` are all missing from the spec).
Deliberately not derived from only the currently-visible page either — that shrinks the
available chips to whatever's in the current filtered result, making it impossible to
navigate back to a different filter combination once one is applied.

### Query param parsing (`src/lib/query-params.ts`)

Guards three things before any value reaches a fetch URL: a param can legally repeat in
a URL (`?tag=a&tag=b`), which Next/Node type as `string[]` — only the first value is
used, since both the API and this UI assume single values. `page` is validated to a
positive integer, falling back to `1` for anything non-numeric, negative, or
fractional — this is the same `Number()` → `NaN` → silent-empty-array footgun in
`GET /api/products` identified in the original audit, now guarded before it can bite.
Blank-string params (e.g. `?q=`) are treated as absent, not as a literal empty filter.

### `page`, not `offset`, in the URL

The UI URL uses `?page=2` (1-indexed, default 1), converted to `offset` internally via
`getOffset()` only when building the API request. `limit` is a fixed constant
(`PRODUCTS_PAGE_SIZE = 12`), not URL-controlled — no page-size selector. Reasoning:
`offset` in the URL couples its meaning to whatever `limit` happens to be; if `limit`
ever changed, existing `?offset=24` links would silently point at different content.
`?page=3` stays meaningful regardless, and is more conventional to read/share.

### `router.replace` for filters/search, `router.push` for pagination

Search and filter changes use `router.replace(..., { scroll: false })`: `push` would
add a browser-history entry per debounced keystroke or filter click, so pressing Back
would step through every intermediate search state one at a time. `{ scroll: false }`
avoids jumping the viewport to the top mid-scroll when the grid is filtered underneath
the user's current position. Pagination is the one deliberate exception — it uses
`router.push` (default scroll-to-top) so Back naturally returns to the previous page,
per an explicit tradeoff: this is slightly inconsistent with the "everything else uses
replace" rule, but pagination is the one control where a user's mental model is "go
somewhere and be able to come back," unlike typing into a search box.

### Search is debounced, not immediate or submit-only

350ms after the user stops typing, via a local `useEffect`/`setTimeout` in
`ProductFilters` (no library). Immediate-per-keystroke updates would fire a real
Server Component re-fetch against an API with 200-500ms artificial latency on every
character — visibly janky, not just wasteful. Changing `q` (or `collection`/`tag`)
always drops the `page` param entirely (back to page 1) in the same URL update, so a
search performed while on page 3 can't silently land on an empty page that has real
matches on page 1.

### Filter UI shape

Collections render as a small pill row (5 values — "All" + 5 collections is compact
enough to be scannable at a glance). Tags render as a native `<select>`, not pills —
~22 values would be a lot of pills, and more importantly the API's `tag` param only
ever accepts one value, so a multi-select control would misrepresent a capability the
API doesn't have. Pagination is Prev/Next + "Page X of Y" text, not a numbered
page-jump widget — the catalog is 26 items; filtered subsets are frequently one page,
so a page-number list would be solving a scale problem this dataset doesn't have.

### Verification for search/filter/pagination

`pnpm typecheck` and `pnpm lint` clean across the whole repo. `pnpm build` succeeds
with `/products` correctly marked dynamic (`ƒ`, server-rendered on demand) rather than
attempting static prerendering — this specifically rules out the
"`useSearchParams()` should be wrapped in a Suspense boundary" build warning some
Next.js App Router setups hit, confirmed empirically rather than assumed. Verified
against the project's running dev server: default load (12 products, "Page 1 of 3"
matching `Math.ceil(26/12)`), a real search match rendering the grid (not the empty
state), a genuinely-empty search correctly rendering the empty state, a collection
filter narrowing results correctly, `page=abc` and `page=-5` both safely falling back
to page 1 instead of hitting the API's `NaN`-slice footgun, real page-2 pagination, and
a repeated `?tag=a&tag=b` param correctly resolving to just the first value. One
verification pitfall worth naming: naively grepping raw SSR HTML for the empty-state
message text produces false positives, because Next embeds a client component's props
(including an unused `emptyMessage` string) in the page's hydration payload regardless
of which branch actually rendered — confirming the *empty-state `<p>` element itself*
was present or absent was the check that mattered. Not verified: the debounced search
input and pill/select clicks as actual browser interactions (no browser-automation tool
available in this environment) — the URL-construction logic they call
(`updateFilters`/`goToPage`) was exercised directly via the curl checks above, since it
produces the same URLs a real click would.

## Phase 4 — Quick View modal

Adds the Quick View modal, variant selector, and Add to Cart wiring. Still no cart
drawer, checkout, or `localStorage`.

### Reuses grid data, no refetch by id

`ProductGrid` already receives the full `Product` objects from the Server Component
(same shape `GET /api/products/:id` would return), so `QuickViewModal` takes a
non-null `product` prop directly instead of fetching by id. This was flagged as an open
question all the way back in the initial audit; it's no longer ambiguous once the grid
genuinely holds the complete `Product` type. The tradeoff this forecloses: a
deep-linkable Quick View URL (opened without the grid ever being fetched) would need a
real fetch — explicitly out of scope for this phase.

### Modal state lives in `ProductGrid`, not a new controller

`ProductGrid` already owned the click handler as of Phase 2 (originally a `console.log`
placeholder). It now holds `selectedProduct: Product | null` and conditionally renders
`QuickViewModal`, which can assume a non-null `product` — no separate controller
component, no null-guards threaded through the modal itself.

### Initial variant selection

Opens on the first in-stock variant (`product.variants.find(isVariantInStock)`),
falling back to `product.variants[0]` only if every variant is out of stock (no product
in the mock data actually hits that fallback — verified by simulating an all-OOS
product against the real fallback logic, since the dataset itself can't exercise it).
Opening on an in-stock variant means the modal shows a real, purchasable price and
"In stock" state immediately, rather than requiring the user to click through options
first. `getVariantOptionValues` converts that variant into the initial
`Record<optionId, value>` selection.

### Structural unavailability vs. out-of-stock are different UI states

These are two different conditions found during the original audit, and conflating
them would be wrong:

- **No variant exists at all** for a combination (`prod_20`'s King+Slate) — the option
  value is **disabled** in `VariantSelector`, via `getAvailableOptionValues`. There's no
  SKU or price behind it; a disabled pill is the honest representation, not a
  compromise.
- **A variant exists but `inventory_quantity` is 0** (`prod_01`'s Navy Blue,
  `prod_03`/`prod_08`'s other OOS variants) — the option stays **selectable**. Once
  selected, the modal shows an "Out of stock" state and disables Add to Cart, but
  hiding the option entirely would hide the fact that the variant — and its price —
  exist at all.

`prod_14` is the other real edge case exercised here: it declares exactly one option
(`Size`) despite its variant titles carrying an unmodeled "Black" suffix
(`variant-utils.ts`'s Phase 1 fix already handles the parsing) — `VariantSelector`
renders exactly one option group for it, not a phantom second one, confirmed by
checking `Object.keys(selection).length === 1` against the real fixture.

### Add to Cart: stays open, inline confirmation, no toast

Clicking Add to Cart dispatches `ADD_ITEM` with the *matched* variant's live
price/stock (not `getStartingPrice`, which is a grid-card-only concern), adds exactly 1
unit, and does not close the modal. The button label flips to "Added!" for 1.5s via
local state, then reverts — no toast/notification system, which would be real added
state (stacking, positioning) for a signal a one-line button-label change already
covers. A quantity stepper was deliberately left out of this phase: the cart reducer's
`UPDATE_QUANTITY` action (built in Phase 1) already exists for that, and it has a more
natural home in the cart drawer where the whole cart — not just one product — is
visible.

### Focus restoration uses the exact clicked element, not `document.activeElement`

`ProductCard`'s Quick View button now calls `onQuickView(product, event.currentTarget)`
instead of `onQuickView(product)`. The simpler alternative — reading
`document.activeElement` inside `ProductGrid`'s handler — was considered and rejected:
Safari and Firefox don't always move focus to a button on click (a known cross-browser
quirk), so `document.activeElement` isn't reliably the clicked button in every browser.
Passing the element explicitly via `event.currentTarget` is correct regardless of that
quirk. `ProductGrid` stores it in a ref and calls `.focus()` on it after closing the
modal, for every close path (Escape, backdrop, close button) — they all funnel through
the same `onClose` callback.

### Accessibility

`role="dialog"`, `aria-modal="true"`, `aria-labelledby` (product title),
`aria-describedby` (description), rendered via `createPortal` into `document.body`
(avoids z-index/clipping risk from the grid's own containers — built into `react-dom`,
not a new dependency). Escape closes; backdrop click closes only when
`event.target === event.currentTarget`, so clicks inside the dialog content don't
bubble up and close it. Body scroll is locked while open and restored to its previous
value (not just `""`) on cleanup. Focus moves to the close button on open and returns
to the exact trigger button on close (see above). Tab cycling is a small, inline
implementation scoped to this modal's actual focusable elements, re-queried on every
Tab press since the set changes as option availability changes (an out-of-stock pill
becoming enabled/disabled doesn't require re-wiring anything) — deliberately not a
reusable `useFocusTrap` hook or a generic dialog abstraction, since that's
solving a problem this app doesn't have.

### `localStorage` still deferred, but the reason has changed

This is the third time persistence has been deferred, but not for the same reason as
before. Phases 2 and 3 deferred it because there was no real Add-to-Cart flow to verify
it against — that condition is resolved now. It's still not in this phase because Phase
4 is already substantial (modal, variant selector, cart wiring, accessibility); it
becomes the small, first item of Phase 5, verified immediately against the real
Add-to-Cart flow this phase delivers, rather than continuing to ride along with
whichever phase happens to build the cart drawer.

### Verification for Quick View

`pnpm typecheck`, `pnpm lint`, and `pnpm build` are all clean — the production build
specifically confirms the new client-component tree (`ProductGrid` → `QuickViewModal`
→ `VariantSelector`, plus the `createPortal` call) composes without any Server/Client
boundary violation. Quick View is fully client-side interactive (clicks, focus,
portal rendering), and no browser-automation tool is available in this environment, so
actual clicking/keyboard interaction in a real browser was not exercised directly. What
was verified with a disposable script (not committed) against the real
`mock-data/products.json`, mirroring the exact logic `QuickViewModal` runs: `prod_01`'s
initial variant resolves to the in-stock Black, not Navy Blue; selecting Navy Blue
resolves to a real, selectable-but-out-of-stock variant; `prod_20`'s King+Slate has no
matching variant and Slate is excluded from available values once King is picked;
`prod_14` produces exactly one option in its initial selection; `prod_03` and `prod_08`
also default to an in-stock variant; the all-out-of-stock `variants[0]` fallback path
was exercised against a simulated product, since no real product in the dataset hits
it; and the cart reducer, driven with the exact item shape `QuickViewModal` constructs,
confirms two Add to Cart clicks on the same variant produce one line at quantity 2 (not
two lines), a different variant of the same product produces a second line, and the
header's count (sum of quantities) reads 3 after those three clicks.

## Phase 5 — Cart drawer and `localStorage` persistence

Adds the cart drawer and, after it existed and could verify against it, persistence.
Still no checkout — that's Phase 6.

### Implementation order: drawer first, then persistence

There's no real implementation dependency between these two — persistence just
hydrates/writes whatever `state.items` already is, regardless of who's reading it. The
reason to build the drawer first is verification quality: before this phase the only
observable cart signal was the header's bare count number. With the drawer built
first, it becomes the actual instrument for verifying persistence afterward — add
items, open the drawer, confirm quantities/thumbnails/totals, reload, reopen, confirm
it's identical — rather than verifying persistence blind against a single integer.

### Shared dialog mechanics: extracted, but narrowly

`src/lib/use-dialog.ts` is a ~60-line hook shared by `QuickViewModal` and `CartDrawer`,
covering exactly the interaction mechanics both need: focus-in on open, body scroll
lock (save/restore the previous `overflow` value, not just `""`), Escape to close, a
Tab cycle scoped to the dialog's own focusable elements (re-queried on every Tab press,
since which pills/buttons are enabled changes as selection/cart state changes), and
backdrop-click-to-close (guarded to `event.target === event.currentTarget` so clicks
inside the dialog don't bubble up and close it). Deliberately narrow: it takes one
argument (`onClose`), returns three things (a container ref, an initial-focus ref, a
backdrop click handler), and renders nothing itself — each dialog still owns its own
`createPortal` call, markup, and `aria-*` attributes. It does **not** handle
focus-return-to-trigger, since that's specific to each trigger (`ProductGrid`'s
Quick View button ref vs. `Header`'s cart button ref), not to the dialog. This is a
narrower thing than the "generic modal abstraction" ruled out in Phase 4 — it's reuse
across two consumers that exist right now, not a configurable framework for
hypothetical future ones. `QuickViewModal` was updated to use it in the same commit as
the extraction, confirming the hook actually covers its existing behavior with no
regression (verified via `pnpm build` and the Phase 4 disposable script re-run, both
unchanged in outcome).

### Drawer state lives in `Header`, not a new wrapper

Same reasoning as Quick View's: `Header` already owns the cart trigger and already
reads `useCart()`. It now also owns `isDrawerOpen` and conditionally renders
`CartDrawer` — no `AppShell`/`CartShell` layer for one boolean. The cart icon, static
since Phase 2 ("deliberately not a clickable link yet... becomes interactive in the
cart-drawer phase"), is now a real `<button>` with an `aria-label` reflecting the live
item count.

### `CartLineItem` is a separate component

Mirrors the `VariantSelector`/`QuickViewModal` split from Phase 4: a cart row
(thumbnail, title, variant, price, quantity controls, line total, remove) is
comparably complex to `ProductCard`, which is also its own file. Keeps `CartDrawer`
focused on the dialog shell, empty state, item list, and total.

### Quantity controls: UI-level echo of the reducer's own rule

The `−` button is disabled at quantity 1, the `+` button is disabled at
`availableQuantity` — both are UI-level enforcement of limits the reducer already
guarantees (`UPDATE_QUANTITY` clamps to `[1, availableQuantity]`, established in Phase
1). Disabling `−` at 1 rather than letting it silently remove the item extends the same
"removal must be a deliberate, separate action" rule from the reducer up into the UI —
`REMOVE_ITEM` (the explicit "Remove" link) is the only path to zero. Both dispatches go
through `UPDATE_QUANTITY` with `quantity ± 1`; the reducer's own clamp remains a
backstop even though the UI shouldn't be able to trigger it once the buttons are
correctly disabled — verified directly (see below), not just asserted.

### No checkout CTA in the drawer

A disabled "Checkout" button with nowhere to go would be worse than no button at all.
The real one is added when Phase 6 actually builds checkout.

### `localStorage`: hydration-safe sequencing

The subtle part isn't reading/writing `localStorage` — it's not writing `{ items: [] }`
over a real saved cart on every single mount before hydration has had a chance to run.
`CartProvider` always initializes `useReducer` with the plain `{ items: [] }` default
(so server-rendered and first-client-render markup always match — no SSR/CSR
mismatch), then a mount-only `useEffect` reads `localStorage` and re-dispatches each
saved item through the existing `ADD_ITEM` action (rather than adding a new reducer
action type just for hydration — reuses what's already there and rebuilds the cart the
same way a user would have, one line at a time), finishing by setting a `hasHydrated`
flag. The save effect is gated on that flag, and critically the flag is **React state,
not a ref**: a ref set synchronously inside the hydration effect would already read as
`true` by the time the save effect's *first* run happens in the same commit (effects
run in declaration order within one commit), so the save effect would still fire once
with the stale `{ items: [] }` before the hydration dispatches take effect on the next
render. Using `useState` instead means the save effect's first-run closure captures
`hasHydrated = false` from the render it was created in, correctly skipping that write
entirely — persistence never writes a blank cart over a real one, not even for one
tick.

### Malformed `localStorage` data: validate the shape, filter items individually

`loadCartItems` never throws: a missing key, invalid JSON, a non-object top level, or a
non-array `items` field all fall back to `[]`. Beyond that minimum, each item in the
array is validated individually (`isValidCartItem` checks every `CartItem` field's
type) and only the valid ones are kept — one corrupted entry doesn't cost the rest of
a real cart. `saveCartItems` also can't throw (`localStorage.setItem` can fail on quota
or in some private-browsing modes) — losing persistence silently beats crashing the
cart. No versioning/migration system: there's exactly one `CartItem` shape in this
project's history and no prior format to migrate from: the malformed-data guard is
already the correct behavior for a hypothetical future shape change (reset to empty
rather than crash), so a version field would be solving a problem this project doesn't
have.

### Verification for the cart drawer and persistence

`pnpm typecheck`, `pnpm lint`, and `pnpm build` all clean throughout, including
immediately after the `use-dialog.ts` extraction (confirming no regression in
`QuickViewModal` before building on top of it). `loadCartItems`/`saveCartItems` are
exported (mirroring the Phase 1 precedent of exporting `cartReducer` for the same
reason) and were driven directly with a minimal in-memory `localStorage` mock (no
jsdom/test framework — not warranted for this): a missing key, invalid JSON, a
top-level array instead of an object, a non-array `items` field, a top-level `null`,
and a mixed array of one valid item plus two malformed ones (confirming exactly the
one valid item survives, not zero and not all three) all resolve to the correct safe
result; a save-then-load round-trip returns the exact data saved; and a
`localStorage.setItem` that throws (simulating quota-exceeded/private browsing) is
swallowed without crashing. The cart reducer was also re-driven with the drawer's exact
dispatch shapes (`UPDATE_QUANTITY` with `quantity + 1`/`quantity - 1`, `REMOVE_ITEM`)
to confirm the increment/decrement/remove paths and the cart total
(`sum(unitPrice * quantity)` across lines) match what `CartDrawer` actually computes.
Not verified: real browser interaction with the drawer (open/close/focus-return/Tab
cycle) — no browser-automation tool is available in this environment, same limitation
noted in every prior phase's UI verification.

## Phase 6 — Checkout

Adds checkout as a third view inside the existing `CartDrawer`. This is the last cart
phase — the take-home's core requirements are now all covered.

### Checkout is a view swap inside the same dialog, not a new page or a second modal

`CartDrawer` now tracks `view: "cart" | "checkout" | "success"` and swaps its body
content accordingly, while the single `role="dialog"` container from `useDialog`
(portal, focus trap, Escape, guarded backdrop-click, scroll lock) stays exactly as it
was — nothing about the dialog mechanics needed to change to support this. The
alternative that was actually risky — a second dialog opened from within the first for
checkout — would have meant coordinating two focus traps and two Escape/backdrop
handlers; a separate `/checkout` page would have meant deciding what happens to the
drawer's open state across a navigation. Neither problem exists here, because there's
only ever one dialog instance across the whole cart → checkout → success flow.

### `zod`, not hand-rolled validation

`zod` has been an installed, unused dependency since the project scaffold — this is
its first real use. `checkoutSchema` validates six fields (full name, email, phone
[optional], street address, city, postal code) with `.trim()` applied before length
checks (so whitespace-only input correctly fails, verified directly — see below).
`result.error.flatten().fieldErrors` maps directly to a `Record<field, string[]>`,
which is what makes per-field inline errors straightforward without any extra
transformation code. No React Hook Form or other form library — `useState` for values
and errors, plus one `safeParse` call on submit, is the whole implementation.

### Submit is synchronous — no fake processing state

There's no real backend to submit to, so there's nothing to await. On a valid
submission, `CartDrawer` captures an order summary (item count, formatted total) from
`state.items` *before* dispatching `CLEAR_CART` — reading `state.items` synchronously
in the same function call is safe because `dispatch` doesn't mutate `state` in place,
it schedules the next render, so the closure's `state` reference is still the
pre-clear cart for the rest of that function. Then `CLEAR_CART` (built in Phase 1,
otherwise unused until now) and a `view` change to `"success"` happen together. No
artificial delay or spinner — simulating a fake network round-trip would itself be the
kind of fake logic the README says to avoid.

### Focus shifts on each view transition, not just on dialog open

`useDialog`'s focus-in-on-open fires exactly once, when the dialog first mounts —
correct for opening the drawer, but silent on every subsequent view swap, since
swapping content doesn't remount the dialog. Without an explicit fix, clicking
"Proceed to Checkout" unmounts the button that had focus and leaves focus nowhere
(typically falling back to the document body), which is a real regression for
keyboard/screen-reader users, not a cosmetic one. `CartDrawer` owns one `headingRef`
on its own header `<h2>` (which already displays "Cart"/"Checkout"/"Order Confirmed"
depending on `view`) with `tabIndex={-1}`, and a `useEffect` keyed on `view` moves
focus there whenever the view becomes `"checkout"` or `"success"`. One shared ref for
one element that already exists in every view, rather than a separate heading per
view, keeps this from needing three different focus targets to manage. The success
message also carries `aria-live="polite"` as a second, independent signal — heading
focus already announces the change to a screen reader, but the two together aren't
redundant so much as belt-and-suspenders for a state change that isn't a page
navigation and might otherwise go unannounced.

### A Back button, separate from Close

The checkout view's header row gets a `←` button (visible only in that view) that
returns to the `cart` view without closing the drawer, alongside the existing `✕` that
always closes it outright. These are different user intents — "let me reconsider what's
in my cart" versus "I'm done" — and collapsing them into one control would have made
one of the two actions unreachable.

### Empty cart during checkout: guarded, but can't actually happen

"Proceed to Checkout" only renders in the non-empty cart-view footer, and the item
list (with its remove buttons) isn't rendered simultaneously with the checkout form,
so there's no UI path that both empties the cart and stays on the checkout view at the
same time — this was reasoned through explicitly rather than assumed. A `useEffect`
still bounces `view` back to `"cart"` if `view === "checkout" && state.items.length ===
0` is ever true, as a cheap, explicit guard against that state rather than trusting the
reasoning alone. No new cart reducer behavior was added for this — it's pure view-state
management in `CartDrawer`.

### No order number

Skipped entirely rather than shown as a fake one — the checkout requirement lists a
success message, not order tracking, and inventing an order ID with no backend to
issue or persist it would be exactly the kind of fake-but-looks-real detail this phase
was scoped to avoid.

### Verification for checkout

`pnpm typecheck`, `pnpm lint`, and `pnpm build` all clean. `checkoutSchema` was
verified two ways: first against a hand-written copy of the same zod calls (fast
iteration), then — for full rigor, matching the standard used in every prior phase —
against the actual compiled `src/lib/checkout-schema.ts`, confirming its real exports
(`checkoutSchema`, `checkoutFieldOrder`, `emptyCheckoutFormValues`) match exactly what
`CheckoutForm.tsx` imports, that a fully valid submission passes, and that
`CheckoutForm`'s own initial state (`emptyCheckoutFormValues`, all fields blank)
correctly fails validation on first render before any input. Also verified: every
required field produces an error when empty while the optional `phone` field does not;
the "first invalid field to focus" logic correctly identifies the sole invalid field
in a single-error case; a set of realistic malformed and valid email addresses
(subdomains, plus-addressing, missing `@`, trailing dot) are rejected/accepted
correctly; whitespace-only input in a required field fails validation, confirming
`.trim()` runs before the length check rather than after; and the order summary
math (`sum(unitPrice * quantity)`, `sum(quantity)`, and the `₪` formatting) matches
`CartDrawer`'s exact computation against a two-line-item cart. Live-checked against
the project's running dev server: `/products` and `/` both still return 200 and render
correctly with the new drawer code loaded. Not verified: real browser interaction with
the checkout form (typing, submit, focus landing on the right element, Back/Continue
Shopping clicks) — no browser-automation tool is available in this environment, the
same limitation noted in every prior phase's UI verification.

## Phase 7 — Final review fixes

A self-review pass, done as if evaluating this submission cold, found one real bug and
one gap against the README's own required `DECISIONS.md` structure. Both fixed here;
nothing else changed.

### Focus-trap leak in `CartDrawer`'s success view

`useDialog`'s Tab-cycle only intercepted Tab/Shift+Tab when `document.activeElement`
was exactly the first or last element in its tracked `focusable` list. When
`CartDrawer` moves focus to its header `<h2>` (`tabIndex={-1}`, used to announce a view
change to screen readers) on entering the `checkout` or `success` view, that heading is
deliberately excluded from `focusable` — it's not meant to be a normal tab stop. In the
`checkout` view this was accidentally harmless, because a Back button happens to render
immediately before the heading in DOM order, so the browser's native Shift+Tab still
landed inside the dialog. In the `success` view there's no Back button, so Shift+Tab
from the heading walked straight out of the portal into the underlying page. Fixed by
checking whether `document.activeElement` is in `focusable` at all before the
first/last comparison; if it isn't, Tab now moves to the first focusable element and
Shift+Tab to the last, both with `preventDefault()`. This also makes the `checkout`
view's behavior more consistent as a side effect — Shift+Tab from its heading now
wraps to the true last element (e.g. "Place Order") instead of landing on the Back
button, which happened to work before but only by accident of markup order. `useDialog`
stayed the same size and shape — no new option, no new file, no generic frame
extracted.

## Tradeoffs

What would change with more time, honestly assessed:

- **No browser automation.** Every phase's UI logic was verified through
  `pnpm typecheck`/`lint`/`build`, disposable scripts run against the real compiled
  code and real `mock-data/products.json` (never hand-picked fixtures), and live
  checks against the running dev server — but nothing here clicked a real button in a
  real browser. The focus-trap bug this phase fixes is a direct consequence: it was
  found by re-reading the code and reasoning through DOM/focus semantics during a
  review pass, not caught by any of the verification that ran during the phase that
  introduced it. A Playwright (or similar) smoke suite covering the two dialogs'
  keyboard paths would have caught it immediately, and is the single highest-value
  thing missing from this project's testing story.
- **`/product/[id]` is still the original starter stub.** A standalone product detail
  page was never part of the README's core requirements — Quick View covers product
  detail viewing — so it was deliberately left untouched rather than built out or
  removed.
- **Quick View reuses grid data instead of refetching by id.** The grid already holds
  the full `Product` shape, so a refetch would return identical data at the cost of
  the mock API's artificial latency. This only stops being the right call if Quick
  View ever needs to be deep-linkable (opened via URL without the grid having been
  fetched first), which wasn't in scope.
- **No quantity stepper in Quick View.** Add to Cart always adds exactly 1; quantity
  adjustment lives entirely in the cart drawer, which already has `UPDATE_QUANTITY`
  wired up. Fine for this scope, but a stepper in Quick View would be a reasonable
  addition if the product ever needed "buy 3 of this right now" as a fast path.
- **Checkout is a client-side success flow only.** No backend submission, no payment
  fields, no order persistence or order ID — deliberately, per the README's own "no
  real backend needed" instruction. A real implementation would need all of the above
  plus idempotency handling for double-submits.
- **Price formatting (`Intl.NumberFormat` currency call) is duplicated in four
  places** (`ProductCard`, `QuickViewModal`, `CartLineItem`, `CartDrawer`). Each
  individual phase had a defensible reason not to extract it at the time (respecting
  that phase's exact approved file scope), but across the whole project this is now a
  real, findable DRY violation. A small `formatPrice(amount, currencyCode)` helper
  would be a reasonable five-minute cleanup with more time.

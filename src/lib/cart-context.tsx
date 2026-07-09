"use client"

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from "react"
import type { CartAction, CartItem, CartState } from "@/types/cart"

const initialState: CartState = { items: [] }

const CART_STORAGE_KEY = "youleap-cart"

function isValidCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false
  const item = value as Record<string, unknown>

  return (
    typeof item.productId === "string" &&
    typeof item.variantId === "string" &&
    typeof item.title === "string" &&
    typeof item.variantTitle === "string" &&
    typeof item.thumbnail === "string" &&
    typeof item.unitPrice === "number" &&
    typeof item.currencyCode === "string" &&
    typeof item.quantity === "number" &&
    typeof item.availableQuantity === "number"
  )
}

/**
 * Never throws. Missing key, invalid JSON, a wrong top-level shape, or
 * individually malformed items all fall back safely rather than reaching
 * the reducer — malformed items are filtered out rather than discarding
 * the whole cart, so one bad entry doesn't cost the rest.
 */
export function loadCartItems(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    const items = (parsed as { items?: unknown } | null)?.items

    if (!Array.isArray(items)) return []

    return items.filter(isValidCartItem)
  } catch {
    return []
  }
}

export function saveCartItems(items: CartItem[]): void {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }))
  } catch {
    // Storage can throw (quota exceeded, private browsing) — losing
    // persistence silently is preferable to crashing the cart.
  }
}

// Quantity is clamped to [1, availableQuantity]. If availableQuantity is 0
// (out of stock), the result is 0 — call sites are expected to prevent
// adding an out-of-stock variant in the first place; this is a last resort.
function clampQuantity(quantity: number, availableQuantity: number): number {
  return Math.min(Math.max(quantity, 1), Math.max(availableQuantity, 0))
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const { item } = action
      const existing = state.items.find((i) => i.variantId === item.variantId)

      if (!existing) {
        return {
          items: [
            ...state.items,
            { ...item, quantity: clampQuantity(item.quantity, item.availableQuantity) },
          ],
        }
      }

      return {
        items: state.items.map((i) =>
          i.variantId === item.variantId
            ? {
                ...i,
                quantity: clampQuantity(i.quantity + item.quantity, i.availableQuantity),
              }
            : i
        ),
      }
    }

    case "REMOVE_ITEM": {
      return { items: state.items.filter((i) => i.variantId !== action.variantId) }
    }

    case "UPDATE_QUANTITY": {
      return {
        items: state.items.map((i) =>
          i.variantId === action.variantId
            ? { ...i, quantity: clampQuantity(action.quantity, i.availableQuantity) }
            : i
        ),
      }
    }

    case "CLEAR_CART": {
      return { items: [] }
    }

    default:
      return state
  }
}

type CartContextValue = {
  state: CartState
  dispatch: Dispatch<CartAction>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const [hasHydrated, setHasHydrated] = useState(false)

  // Reads localStorage only after mount (never during render), so the
  // server-rendered and first-client-render markup always match — the
  // initial state is always { items: [] } on both. Reusing ADD_ITEM here
  // (rather than a new reducer action) rebuilds the cart from whatever was
  // saved, one line at a time.
  useEffect(() => {
    for (const item of loadCartItems()) {
      dispatch({ type: "ADD_ITEM", item })
    }
    setHasHydrated(true)
  }, [])

  // Gated on hasHydrated (React state, not a ref) so this can't fire with
  // the still-default { items: [] } before hydration has been applied —
  // that would overwrite a real saved cart with nothing on every reload.
  useEffect(() => {
    if (!hasHydrated) return
    saveCartItems(state.items)
  }, [state.items, hasHydrated])

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }

  return context
}

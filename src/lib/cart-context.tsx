"use client"

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react"
import type { CartAction, CartState } from "@/types/cart"

const initialState: CartState = { items: [] }

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

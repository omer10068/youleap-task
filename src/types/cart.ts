export type CartItem = {
  productId: string
  variantId: string
  title: string
  variantTitle: string
  thumbnail: string
  unitPrice: number
  currencyCode: string
  quantity: number
  availableQuantity: number
}

export type CartState = {
  items: CartItem[]
}

export type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "REMOVE_ITEM"; variantId: string }
  | { type: "UPDATE_QUANTITY"; variantId: string; quantity: number }
  | { type: "CLEAR_CART" }

"use client"

import { createContext, useContext, useState, useEffect } from "react"

interface CartItem {
  productId: string
  name: string
  price: number
  image?: string
  quantity: number
  slug: string
}

interface CartContextType {
  items: CartItem[]
  storeId: string
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
  count: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children, storeId }: { children: React.ReactNode; storeId: string }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const saved = localStorage.getItem(`cart-${storeId}`)
    if (saved) setItems(JSON.parse(saved))
  }, [storeId])

  useEffect(() => {
    localStorage.setItem(`cart-${storeId}`, JSON.stringify(items))
  }, [items, storeId])

  function addItem(item: Omit<CartItem, "quantity">) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) { removeItem(productId); return }
    setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity } : i))
  }

  function clearCart() { setItems([]) }

  const total = items.reduce((acc, i) => acc + i.price * i.quantity, 0)
  const count = items.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, storeId, addItem, removeItem, updateQuantity, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}

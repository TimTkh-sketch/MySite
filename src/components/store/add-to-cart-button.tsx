"use client"

import { useState } from "react"
import { ShoppingCart, Check } from "lucide-react"
import { useCart } from "./cart-provider"

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  slug: string
  stock: number
}

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      slug: product.slug,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (product.stock === 0) {
    return (
      <button disabled className="w-full h-12 bg-gray-200 text-gray-400 font-semibold rounded-xl cursor-not-allowed">
        Нет в наличии
      </button>
    )
  }

  return (
    <button
      onClick={handleAdd}
      className={`w-full h-12 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
        added
          ? "bg-green-600 text-white"
          : "bg-[#FF6B35] text-white hover:bg-[#e55a25]"
      }`}
    >
      {added ? (
        <>
          <Check className="h-5 w-5" />
          Добавлено в корзину
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5" />
          В корзину
        </>
      )}
    </button>
  )
}

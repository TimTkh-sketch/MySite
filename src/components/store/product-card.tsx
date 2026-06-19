"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Check } from "lucide-react"
import { formatPrice, getDiscount } from "@/lib/utils"
import { useCart } from "./cart-provider"
import { useState } from "react"

interface Product {
  id: string
  name: string
  slug: string
  price: number
  comparePrice?: number | null
  images: string[]
  stock: number
}

export function ProductCard({ product, storeSlug }: { product: Product; storeSlug: string }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const discount = getDiscount(product.price, product.comparePrice)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      slug: product.slug,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <Link
      href={`/store/${storeSlug}/product/${product.slug}`}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300 text-xs">
            Нет фото
          </div>
        )}

        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-[#FF6B35] text-white text-xs font-bold px-2 py-0.5 rounded-full">
            −{discount}%
          </span>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
              Нет в наличии
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.name}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="text-base font-bold text-gray-900">{formatPrice(product.price)}</p>
            {product.comparePrice && product.comparePrice > product.price && (
              <p className="text-xs text-gray-400 line-through">{formatPrice(product.comparePrice)}</p>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`shrink-0 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              added
                ? "bg-green-500 text-white"
                : "bg-[#FF6B35] text-white hover:bg-[#e55a25]"
            }`}
            aria-label="В корзину"
          >
            {added ? (
              <Check className="h-4 w-4" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{added ? "Добавлено" : "В корзину"}</span>
          </button>
        </div>
      </div>
    </Link>
  )
}

"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart } from "lucide-react"
import { formatPrice, getDiscount } from "@/lib/utils"
import { useCart } from "./cart-provider"

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
  const discount = getDiscount(product.price, product.comparePrice)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      slug: product.slug,
    })
  }

  return (
    <Link href={`/store/${storeSlug}/product/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 mb-3">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300 text-sm">Нет фото</div>
        )}

        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="absolute bottom-2 right-2 bg-gray-900 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30 hover:bg-gray-700"
        >
          <ShoppingCart className="h-4 w-4" />
        </button>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-1.5">
          {product.name}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-gray-900">{formatPrice(product.price)}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
          )}
        </div>
        {product.stock === 0 && (
          <p className="text-xs text-red-500 mt-0.5">Нет в наличии</p>
        )}
      </div>
    </Link>
  )
}

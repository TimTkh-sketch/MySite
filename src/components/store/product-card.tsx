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

export function ProductCard({ product, storeSlug, index: _index }: { product: Product; storeSlug: string; index?: number }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const discount = getDiscount(product.price, product.comparePrice)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      productId: product.id,
      name:      product.name,
      price:     product.price,
      image:     product.images[0],
      slug:      product.slug,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <Link
      href={`/store/${storeSlug}/product/${product.slug}`}
      className="product-card group flex flex-col"
    >
      {/* Изображение */}
      <div className="relative aspect-square" style={{ background: "var(--bg-gray)" }}>
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.07]"
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-[11px]"
            style={{ color: "var(--text-3)" }}
          >
            Нет фото
          </div>
        )}

        {discount > 0 && (
          <span className="badge-sale absolute top-3 left-3">−{discount}%</span>
        )}

        {product.stock === 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(245,245,247,0.82)" }}
          >
            <span
              className="text-[12px] font-medium px-3 py-1 rounded-full"
              style={{ background: "#fff", color: "var(--text-2)", border: "1px solid var(--border)" }}
            >
              Нет в наличии
            </span>
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <p
          className="text-[14px] font-medium line-clamp-2 leading-snug min-h-[2.5rem]"
          style={{ color: "var(--text)" }}
        >
          {product.name}
        </p>

        <div className="mt-auto space-y-2.5">
          <div className="flex items-baseline gap-2">
            <span
              className="text-[17px]"
              style={{ color: "var(--text)", fontWeight: 700 }}
            >
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span
                className="text-[13px] line-through"
                style={{ color: "var(--text-3)" }}
              >
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="card-btn w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            style={added
              ? { background: "var(--success)", color: "#fff" }
              : { background: "var(--accent)", color: "#fff" }
            }
          >
            {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {added ? "Добавлено" : "В корзину"}
          </button>
        </div>
      </div>
    </Link>
  )
}

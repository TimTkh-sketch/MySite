"use client"

import { useRef } from "react"
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
  const cardRef = useRef<HTMLAnchorElement>(null)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.images[0], slug: product.slug })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  function onMouseMove(e: React.MouseEvent) {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const rx = (y - 0.5) * -10
    const ry = (x - 0.5) * 10
    el.style.transition = "transform 0.08s ease"
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(4px)`
  }

  function onMouseLeave() {
    const el = cardRef.current
    if (!el) return
    el.style.transition = "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)"
    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)"
  }

  return (
    <Link
      ref={cardRef}
      href={`/store/${storeSlug}/product/${product.slug}`}
      className="product-card group flex flex-col"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Image */}
      <div className="relative aspect-square" style={{ background: "#0A0A0A" }}>
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.06]"
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[11px]" style={{ color: "var(--text-3)" }}>
            Нет фото
          </div>
        )}

        {discount > 0 && (
          <span className="badge-sale absolute top-3 left-3">−{discount}%</span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
            <span className="text-[11px] font-medium px-3 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
              Нет в наличии
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <p className="text-[13px] font-medium line-clamp-2 leading-snug min-h-[2.4rem]" style={{ color: "rgba(255,255,255,0.75)" }}>
          {product.name}
        </p>

        <div className="mt-auto space-y-2.5">
          <div className="flex items-baseline gap-2">
            <span style={{ fontSize: 17, fontWeight: 700, color: "var(--accent)", letterSpacing: "-0.01em" }}>
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span style={{ fontSize: 12, textDecoration: "line-through", color: "var(--text-3)" }}>
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="card-btn w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            style={added
              ? { background: "var(--success)", color: "#000" }
              : { background: "rgba(0,204,255,0.12)", color: "var(--accent)", border: "1px solid rgba(0,204,255,0.25)" }
            }
          >
            {added ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
            {added ? "Добавлено" : "В корзину"}
          </button>
        </div>
      </div>
    </Link>
  )
}

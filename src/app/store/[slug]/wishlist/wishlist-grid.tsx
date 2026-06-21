"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, ArrowRight } from "lucide-react"
import { useWishlist } from "@/components/store/wishlist-provider"
import { ProductCard } from "@/components/store/product-card"
import { getWishlistProducts } from "./actions"

interface Product {
  id: string; name: string; slug: string; price: number
  comparePrice: number | null; images: string[]; stock: number; isFeatured: boolean
}

export function WishlistGrid({ storeSlug }: { storeSlug: string }) {
  const { ids, count } = useWishlist()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getWishlistProducts(storeSlug, ids).then(data => {
      setProducts(data as Product[])
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(","), storeSlug])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] rounded-2xl bg-[#f5f5f5] animate-pulse" />
        ))}
      </div>
    )
  }

  if (count === 0 || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ background: "#fff3ee" }}
        >
          <Heart className="h-8 w-8 text-[#F26522]" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">Избранное пустое</h2>
        <p className="text-[#999] text-sm mb-8 max-w-xs">
          Нажмите ♡ на любом товаре, чтобы сохранить его здесь
        </p>
        <Link
          href={`/store/${storeSlug}/catalog`}
          className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold"
        >
          Перейти в каталог <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} storeSlug={storeSlug} index={i} />
      ))}
    </div>
  )
}

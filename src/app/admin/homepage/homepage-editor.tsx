"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Star, Eye, Flame, Clock, ArrowUpRight } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toggleFeatured } from "./actions"

interface Product {
  id: string
  name: string
  price: number
  images: string[]
  isFeatured: boolean
  createdAt: Date
}

interface Props {
  products: Product[]
  featuredProducts: Product[]
  newProducts: Product[]
  storeSlug: string
}

export function HomepageEditor({ products, featuredProducts, newProducts, storeSlug }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimisticFeatured, setOptimisticFeatured] = useState<Record<string, boolean>>(
    () => Object.fromEntries(products.map(p => [p.id, p.isFeatured]))
  )

  const carouselProducts = [
    ...featuredProducts.filter(p => optimisticFeatured[p.id] !== false),
    ...newProducts.filter(p => {
      const isFeat = optimisticFeatured[p.id] ?? p.isFeatured
      return !isFeat && !featuredProducts.find(f => f.id === p.id)
    }),
  ].slice(0, 8)

  function handleToggle(productId: string) {
    const newValue = !(optimisticFeatured[productId] ?? false)
    setOptimisticFeatured(prev => ({ ...prev, [productId]: newValue }))
    startTransition(async () => {
      await toggleFeatured(productId, newValue)
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">

      {/* ── CAROUSEL PREVIEW ─────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Карусель (главная страница)</h2>
          <span className="ml-auto text-xs text-gray-400">{carouselProducts.length} / 8 товаров</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Сначала идут «Хиты продаж», затем новинки — до 8 позиций. Порядок хитов: по убыванию цены.
        </p>

        {carouselProducts.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            Нет товаров в карусели. Отметьте хиты продаж ниже.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {carouselProducts.map((p, i) => (
              <div
                key={p.id}
                className="shrink-0 w-28 rounded-lg overflow-hidden border border-gray-100 bg-gray-50"
              >
                <div className="relative h-20 bg-gray-100 flex items-center justify-center">
                  {p.images[0] ? (
                    <Image src={p.images[0]} alt={p.name} fill className="object-contain p-2" sizes="112px" />
                  ) : (
                    <span className="text-gray-300 text-[10px]">Нет фото</span>
                  )}
                  <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-gray-900 text-white text-[9px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  {p.isFeatured && (
                    <span className="absolute top-1 right-1">
                      <Flame className="h-3 w-3 text-orange-500" />
                    </span>
                  )}
                </div>
                <div className="p-1.5">
                  <p className="text-[10px] text-gray-600 line-clamp-2 leading-tight">{p.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <a
          href={`/store/${storeSlug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 mt-4 text-xs text-blue-600 hover:underline"
        >
          Открыть магазин <ArrowUpRight className="h-3 w-3" />
        </a>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="h-4 w-4 text-orange-500" />
          <h2 className="font-semibold text-gray-900">Хиты продаж</h2>
          <span className="ml-2 text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
            {Object.values(optimisticFeatured).filter(Boolean).length} шт.
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Отмеченные товары появляются в карусели и секции «Хиты продаж». Нажмите звезду чтобы переключить.
        </p>

        <div className="divide-y divide-gray-100">
          {products.map(p => {
            const isFeat = optimisticFeatured[p.id] ?? p.isFeatured
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 py-3 transition-colors ${isFeat ? "bg-orange-50 -mx-6 px-6" : ""}`}
              >
                <div className="relative w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                  {p.images[0] ? (
                    <Image src={p.images[0]} alt={p.name} fill className="object-contain p-1" sizes="40px" />
                  ) : (
                    <span className="text-gray-300 text-[10px]">?</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{formatPrice(p.price)}</p>
                </div>

                <button
                  onClick={() => handleToggle(p.id)}
                  disabled={isPending}
                  title={isFeat ? "Убрать из хитов" : "Добавить в хиты"}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    isFeat
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "bg-gray-100 text-gray-300 hover:bg-gray-200 hover:text-gray-500"
                  }`}
                >
                  <Star className="h-4 w-4" fill={isFeat ? "currentColor" : "none"} />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── NEW ARRIVALS PREVIEW ─────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Новинки</h2>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Последние 10 добавленных товаров. Порядок — по дате добавления (новые первые).
        </p>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {newProducts.slice(0, 10).map((p, i) => (
            <div key={p.id} className="shrink-0 w-28 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
              <div className="relative h-20 bg-gray-100 flex items-center justify-center">
                {p.images[0] ? (
                  <Image src={p.images[0]} alt={p.name} fill className="object-contain p-2" sizes="112px" />
                ) : (
                  <span className="text-gray-300 text-[10px]">Нет фото</span>
                )}
                <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-gray-400 text-white text-[9px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <div className="p-1.5">
                <p className="text-[10px] text-gray-600 line-clamp-2 leading-tight">{p.name}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Чтобы управлять порядком новинок — измените дату добавления товара или его сортировку в разделе{" "}
          <a href="/admin/products" className="text-blue-600 hover:underline">Товары</a>.
        </p>
      </section>

    </div>
  )
}

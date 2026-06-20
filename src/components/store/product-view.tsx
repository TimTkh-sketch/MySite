"use client"

import { useState } from "react"
import { Truck, Shield, RotateCcw, Phone } from "lucide-react"
import { ProductGallery } from "./product-gallery"
import { ProductVariantSelector } from "./product-variant-selector"

interface Variant {
  id: string
  name: string
  value: string
  price: number | null
  stock: number
  image: string | null
}

interface Props {
  product: {
    id: string
    name: string
    price: number
    comparePrice: number | null
    images: string[]
    slug: string
    stock: number
    sku?: string | null
  }
  variants: Variant[]
  phone?: string | null
}

export function ProductView({ product, variants, phone }: Props) {
  const [activeImages, setActiveImages] = useState<string[]>(product.images)

  function handleVariantSelect(variantId: string) {
    const variant = variants.find((v) => v.id === variantId)
    if (variant?.image) {
      const rest = product.images.filter((img) => img !== variant.image)
      setActiveImages([variant.image, ...rest])
    } else {
      setActiveImages(product.images)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:gap-10">

      {/* Left — Gallery */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <ProductGallery images={activeImages} name={product.name} />
      </div>

      {/* Right — Details */}
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-2">
            {product.name}
          </h1>
          {product.sku && (
            <p className="text-xs text-gray-400">Артикул: {product.sku}</p>
          )}
        </div>

        {/* Variant selector (price, options, add to cart) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <ProductVariantSelector
            product={product}
            variants={variants}
            onVariantSelect={handleVariantSelect}
          />
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 divide-y divide-gray-50">
          <div className="flex items-center gap-3 pb-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <Truck className="h-4 w-4 text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Доставка по Перми</p>
              <p className="text-xs text-gray-500">Быстро и удобно, в день заказа</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Гарантия производителя</p>
              <p className="text-xs text-gray-500">Официальная гарантия 1–2 года</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <RotateCcw className="h-4 w-4 text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Возврат 14 дней</p>
              <p className="text-xs text-gray-500">Согласно законодательству РФ</p>
            </div>
          </div>
        </div>

        {phone && (
          <div className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4 text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Есть вопросы? Звоните:</p>
              <a href={`tel:${phone}`} className="text-base font-bold text-gray-900 hover:text-[#FF6B35] transition-colors">
                {phone}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

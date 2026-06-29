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
  colorImages?: Record<string, string[]>
  phone?: string | null
}

export function ProductView({ product, variants, colorImages = {}, phone }: Props) {
  const [activeImages, setActiveImages] = useState<string[]>(product.images)

  function handleVariantSelect(variantId: string) {
    const variant = variants.find((v) => v.id === variantId)
    if (!variant) return

    let colorValue: string | null = null
    try {
      const opts: Record<string, string> = JSON.parse(variant.value)
      colorValue = opts["Цвет"] ?? null
    } catch {}

    if (colorValue && colorImages[colorValue]?.length) {
      setActiveImages(colorImages[colorValue])
      return
    }
    if (variant.image) {
      const rest = product.images.filter((img) => img !== variant.image)
      setActiveImages([variant.image, ...rest])
      return
    }
    setActiveImages(product.images)
  }

  const benefits = [
    { icon: Truck,     title: "Доставка по Перми",        text: "Быстро и удобно, в день заказа" },
    { icon: Shield,    title: "Гарантия производителя",   text: "Официальная гарантия 1–2 года" },
    { icon: RotateCcw, title: "Возврат 14 дней",          text: "Согласно законодательству РФ" },
  ]

  return (
    <div
      className="grid grid-cols-1 gap-6"
      style={{ gridTemplateColumns: "1fr", alignItems: "start" } as React.CSSProperties}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 xl:gap-10 items-start">

        {/* Gallery */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <ProductGallery images={activeImages} name={product.name} />
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <h1
              className="font-black leading-tight tracking-tight"
              style={{ fontSize: "clamp(22px, 3vw, 34px)", letterSpacing: "-0.02em", color: "var(--text)", marginBottom: 6 }}
            >
              {product.name}
            </h1>
            {product.sku && (
              <p className="text-xs" style={{ color: "var(--text-3)" }}>Артикул: {product.sku}</p>
            )}
          </div>

          {/* Variant selector */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <ProductVariantSelector
              product={product}
              variants={variants}
              onVariantSelect={handleVariantSelect}
            />
          </div>

          {/* Benefits */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            {benefits.map((b, i) => {
              const Icon = b.icon
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-4"
                  style={{ borderBottom: i < benefits.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(0,56,255,0.07)",
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{b.title}</p>
                    <p className="text-xs" style={{ color: "var(--text-3)" }}>{b.text}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {phone && (
            <div
              className="flex items-center gap-3 rounded-2xl px-5 py-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,56,255,0.07)" }}
              >
                <Phone className="h-4 w-4" style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: "var(--text-3)" }}>Есть вопросы? Звоните:</p>
                <a
                  href={`tel:${phone}`}
                  className="text-base font-bold transition-colors"
                  style={{ color: "var(--text)" }}
                >
                  {phone}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

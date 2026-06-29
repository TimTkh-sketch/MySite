"use client"

import { useState } from "react"
import { Truck, Shield, RotateCcw, Phone } from "lucide-react"
import { ProductGallery } from "./product-gallery"
import { ProductVariantSelector } from "./product-variant-selector"

interface Variant {
  id: string; name: string; value: string; price: number | null; stock: number; image: string | null
}

interface Props {
  product: {
    id: string; name: string; price: number; comparePrice: number | null
    images: string[]; slug: string; stock: number; sku?: string | null
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
    try { const opts: Record<string, string> = JSON.parse(variant.value); colorValue = opts["Цвет"] ?? null } catch {}
    if (colorValue && colorImages[colorValue]?.length) { setActiveImages(colorImages[colorValue]); return }
    if (variant.image) { setActiveImages([variant.image, ...product.images.filter(i => i !== variant.image)]); return }
    setActiveImages(product.images)
  }

  const benefits = [
    { icon: Truck,     title: "Доставка по Перми",      text: "Быстро и удобно, в день заказа" },
    { icon: Shield,    title: "Гарантия производителя", text: "Официальная гарантия 1–2 года" },
    { icon: RotateCcw, title: "Возврат 14 дней",        text: "Согласно законодательству РФ" },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 xl:gap-10 items-start">

      {/* Gallery */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <ProductGallery images={activeImages} name={product.name} />
      </div>

      {/* Details */}
      <div className="space-y-5">
        <div>
          <h1
            style={{
              fontSize: "clamp(24px, 3.5vw, 40px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 0.92,
              color: "#fff",
              marginBottom: 8,
            }}
          >
            {product.name}
          </h1>
          {product.sku && (
            <p style={{ fontSize: 12, color: "var(--text-3)" }}>Артикул: {product.sku}</p>
          )}
        </div>

        {/* Variant selector */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <ProductVariantSelector product={product} variants={variants} onVariantSelect={handleVariantSelect} />
        </div>

        {/* Benefits */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}>
          {benefits.map((b, i) => {
            const Icon = b.icon
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-5 py-4"
                style={{ borderBottom: i < benefits.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,204,255,0.10)", border: "1px solid rgba(0,204,255,0.15)" }}
                >
                  <Icon className="h-4 w-4" style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{b.title}</p>
                  <p style={{ fontSize: 12, color: "var(--text-3)" }}>{b.text}</p>
                </div>
              </div>
            )
          })}
        </div>

        {phone && (
          <div
            className="flex items-center gap-3 rounded-2xl px-5 py-4"
            style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,204,255,0.10)", border: "1px solid rgba(0,204,255,0.15)" }}
            >
              <Phone className="h-4 w-4" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 2 }}>Есть вопросы? Звоните:</p>
              <a href={`tel:${phone}`} style={{ fontSize: 15, fontWeight: 700, color: "#fff", textDecoration: "none" }}>
                {phone}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

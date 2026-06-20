"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { updateVariantImage } from "@/app/admin/products/actions"
import { Check, Image as ImageIcon } from "lucide-react"

interface Variant {
  id: string
  name: string
  image: string | null
  price: number | null
}

export function VariantImages({ variants, productImages }: { variants: Variant[]; productImages: string[] }) {
  const [images, setImages] = useState<Record<string, string>>(
    Object.fromEntries(variants.map((v) => [v.id, v.image ?? ""]))
  )
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [, startTransition] = useTransition()

  if (!variants.length) return null

  // Check if any variant has a non-default name (i.e. has color/option values)
  const hasOptions = variants.some((v) => v.name && v.name !== "Основной")

  if (!hasOptions) return null

  function save(id: string) {
    startTransition(async () => {
      await updateVariantImage(id, images[id] ?? "")
      setSaved((s) => ({ ...s, [id]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [id]: false })), 2000)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="h-4 w-4 text-orange-500" />
        <h3 className="font-semibold text-gray-900">Изображения по цвету / варианту</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Укажите URL изображения для каждого варианта. На странице товара при выборе цвета — фото автоматически сменится.
      </p>
      <div className="space-y-3">
        {variants.map((variant) => (
          <div key={variant.id} className="flex items-center gap-3">
            {/* Preview */}
            <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              {images[variant.id] ? (
                <Image
                  src={images[variant.id]}
                  alt={variant.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                  onError={() => {}}
                />
              ) : productImages[0] ? (
                <Image
                  src={productImages[0]}
                  alt=""
                  width={40}
                  height={40}
                  className="w-full h-full object-contain opacity-30"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-gray-300" />
                </div>
              )}
            </div>

            {/* Variant name */}
            <div className="w-40 shrink-0">
              <p className="text-sm font-medium text-gray-800 truncate">{variant.name}</p>
              {variant.price && <p className="text-xs text-gray-400">{variant.price.toLocaleString("ru")} ₽</p>}
            </div>

            {/* Image URL input */}
            <input
              value={images[variant.id] ?? ""}
              onChange={(e) => setImages((imgs) => ({ ...imgs, [variant.id]: e.target.value }))}
              onBlur={() => save(variant.id)}
              onKeyDown={(e) => { if (e.key === "Enter") save(variant.id) }}
              placeholder="https://... URL изображения"
              className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
            />

            {/* Saved indicator */}
            {saved[variant.id] && (
              <Check className="h-4 w-4 text-green-500 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

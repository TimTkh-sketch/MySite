"use client"

import { useState, useMemo } from "react"
import { ShoppingCart, Check } from "lucide-react"
import { useCart } from "./cart-provider"
import { formatPrice } from "@/lib/utils"

interface Variant {
  id: string
  name: string
  value: string
  price: number | null
  stock: number
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
  }
  variants: Variant[]
  onVariantSelect?: (variantId: string) => void
}

export function ProductVariantSelector({ product, variants, onVariantSelect }: Props) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  // Parse option groups from variants
  const optionGroups = useMemo(() => {
    if (!variants.length) return {}
    const groups: Record<string, Set<string>> = {}
    for (const v of variants) {
      try {
        const opts: Record<string, string> = JSON.parse(v.value)
        for (const [key, val] of Object.entries(opts)) {
          if (!groups[key]) groups[key] = new Set()
          groups[key].add(val)
        }
      } catch {}
    }
    return groups
  }, [variants])

  const optionKeys = Object.keys(optionGroups)
  const [selected, setSelected] = useState<Record<string, string>>({})

  // Find matching variant for current selection
  const matchedVariant = useMemo(() => {
    if (!optionKeys.length) return null
    const allSelected = optionKeys.every((k) => selected[k])
    if (!allSelected) return null
    return variants.find((v) => {
      try {
        const opts: Record<string, string> = JSON.parse(v.value)
        return optionKeys.every((k) => opts[k] === selected[k])
      } catch { return false }
    }) ?? null
  }, [selected, variants, optionKeys])

  const currentPrice = matchedVariant?.price ?? product.price
  const currentStock = matchedVariant ? matchedVariant.stock : product.stock
  const inStock = currentStock > 0

  function handleAdd() {
    addItem({
      productId: product.id,
      name: product.name + (matchedVariant?.name ? ` (${matchedVariant.name})` : ""),
      price: currentPrice,
      image: product.images[0],
      slug: product.slug,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  // Option type display settings
  const isColorOption = (key: string) => /цвет|color/i.test(key)

  return (
    <div className="space-y-5">
      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-gray-900">{formatPrice(currentPrice)}</span>
        {product.comparePrice && product.comparePrice > currentPrice && (
          <span className="text-lg text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
        )}
        {product.comparePrice && product.comparePrice > currentPrice && (
          <span className="text-sm font-semibold text-white bg-[#FF6B35] px-2.5 py-0.5 rounded-full">
            −{Math.round((1 - currentPrice / product.comparePrice) * 100)}%
          </span>
        )}
      </div>

      {/* Stock */}
      <div>
        {inStock ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            В наличии
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Нет в наличии
          </span>
        )}
      </div>

      {/* Option selectors */}
      {optionKeys.map((key) => {
        const values = [...optionGroups[key]]
        const isColor = isColorOption(key)

        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{key}:</span>
              {selected[key] && (
                <span className="text-sm text-gray-600">{selected[key]}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {values.map((val) => {
                const isSelected = selected[key] === val
                // Check if this value is available with current other selections
                const available = variants.some((v) => {
                  try {
                    const opts: Record<string, string> = JSON.parse(v.value)
                    if (opts[key] !== val) return false
                    // Check other selected options
                    return optionKeys.filter((k) => k !== key).every((k) =>
                      !selected[k] || opts[k] === selected[k]
                    )
                  } catch { return false }
                })

                return (
                  <button
                    key={val}
                    onClick={() => {
                      const newSel = { ...selected, [key]: val }
                      setSelected(newSel)
                      // Find matched variant and notify parent for image switch
                      if (onVariantSelect) {
                        const matched = variants.find((v) => {
                          try {
                            const opts: Record<string, string> = JSON.parse(v.value)
                            return optionKeys.every((k) => (newSel[k] ? opts[k] === newSel[k] : true))
                          } catch { return false }
                        })
                        if (matched) onVariantSelect(matched.id)
                      }
                    }}
                    disabled={!available}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all border-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? "border-[#FF6B35] bg-orange-50 text-[#FF6B35]"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {val}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Add to cart */}
      <button
        onClick={handleAdd}
        disabled={!inStock || (optionKeys.length > 0 && !matchedVariant)}
        className={`w-full h-14 rounded-2xl text-base font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          added
            ? "bg-green-500 text-white"
            : "bg-[#FF6B35] text-white hover:bg-[#e55a25] active:scale-[0.98]"
        }`}
      >
        {added ? (
          <>
            <Check className="h-5 w-5" />
            Добавлено в корзину!
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" />
            {!inStock
              ? "Нет в наличии"
              : optionKeys.length > 0 && !matchedVariant
              ? "Выберите вариант"
              : "В корзину"}
          </>
        )}
      </button>
    </div>
  )
}

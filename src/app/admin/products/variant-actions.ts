"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

type VariantData = {
  price?: number | null
  stock?: number
  sku?: string | null
  image?: string | null
}

export async function saveVariant(id: string, data: VariantData) {
  await db.productVariant.update({ where: { id }, data })
  revalidatePath("/admin/products")
}

export async function deleteVariant(id: string, productId: string) {
  await db.productVariant.delete({ where: { id } })
  revalidatePath(`/admin/products/${productId}`)
}

// Add a value to an option group — creates all new combinations
export async function addOptionValue(
  productId: string,
  optionName: string,
  newValue: string,
  basePrice: number
) {
  const existing = await db.productVariant.findMany({
    where: { productId },
    select: { value: true, price: true },
  })

  // Collect other option groups and their current values
  const otherOptions = new Map<string, Set<string>>()
  for (const v of existing) {
    try {
      const opts: Record<string, string> = JSON.parse(v.value)
      for (const [k, val] of Object.entries(opts)) {
        if (k !== optionName) {
          if (!otherOptions.has(k)) otherOptions.set(k, new Set())
          otherOptions.get(k)!.add(val)
        }
      }
    } catch {}
  }

  // Generate all combinations with the new value
  const combos: Record<string, string>[] = []
  if (otherOptions.size === 0) {
    combos.push({ [optionName]: newValue })
  } else {
    const keys = [...otherOptions.keys()]
    function combine(idx: number, cur: Record<string, string>) {
      if (idx === keys.length) { combos.push({ ...cur, [optionName]: newValue }); return }
      for (const val of otherOptions.get(keys[idx])!) combine(idx + 1, { ...cur, [keys[idx]]: val })
    }
    combine(0, {})
  }

  // Maintain option key ordering from existing variants
  const keyOrder = existing.length > 0
    ? (() => {
        try { return Object.keys(JSON.parse(existing[0].value)) } catch { return [] }
      })()
    : []

  const newVariants = combos.map((opts) => {
    const ordered: Record<string, string> = {}
    for (const k of keyOrder) if (opts[k]) ordered[k] = opts[k]
    ordered[optionName] = newValue // ensure new option is present
    return {
      productId,
      name: Object.values(ordered).join(" / "),
      value: JSON.stringify(ordered),
      price: basePrice,
      stock: 0,
    }
  })

  if (newVariants.length) await db.productVariant.createMany({ data: newVariants })
  revalidatePath(`/admin/products/${productId}`)
}

// Remove all variants that have this option value
export async function removeOptionValue(productId: string, optionName: string, value: string) {
  const all = await db.productVariant.findMany({ where: { productId }, select: { id: true, value: true } })
  const ids = all
    .filter((v) => { try { return JSON.parse(v.value)[optionName] === value } catch { return false } })
    .map((v) => v.id)
  if (ids.length) await db.productVariant.deleteMany({ where: { id: { in: ids } } })
  revalidatePath(`/admin/products/${productId}`)
}

// Add a completely new option group — cross-products with all existing variants
export async function addOptionGroup(
  productId: string,
  optionName: string,
  values: string[],
  basePrice: number
) {
  const existing = await db.productVariant.findMany({ where: { productId }, select: { id: true, value: true, price: true } })

  if (!existing.length) {
    // No variants yet — create fresh
    const newVariants = values.map((val) => ({
      productId,
      name: val,
      value: JSON.stringify({ [optionName]: val }),
      price: basePrice,
      stock: 0,
    }))
    await db.productVariant.createMany({ data: newVariants })
  } else {
    // Cross-product: for each existing variant + each new value, create combo
    const toCreate: object[] = []
    for (const v of existing) {
      for (const val of values) {
        try {
          const opts: Record<string, string> = JSON.parse(v.value)
          opts[optionName] = val
          toCreate.push({
            productId,
            name: Object.values(opts).join(" / "),
            value: JSON.stringify(opts),
            price: v.price ?? basePrice,
            stock: 0,
          })
        } catch {}
      }
    }
    // Replace existing with cross-producted set
    await db.productVariant.deleteMany({ where: { productId } })
    if (toCreate.length) await db.productVariant.createMany({ data: toCreate as never[] })
  }

  revalidatePath(`/admin/products/${productId}`)
}

// Bulk price update for variants
export async function bulkUpdateVariantPrices(productId: string, updates: { id: string; price: number }[]) {
  await Promise.all(updates.map(({ id, price }) => db.productVariant.update({ where: { id }, data: { price } })))
  revalidatePath(`/admin/products/${productId}`)
}

// Set images for a color value — affects ALL variants of this color
export async function setColorImages(productId: string, colorValue: string, images: string[]) {
  await db.productColorImage.upsert({
    where: { productId_colorValue: { productId, colorValue } },
    create: { productId, colorValue, images },
    update: { images },
  })
  revalidatePath(`/admin/products/${productId}`)
}

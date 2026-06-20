"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function applyProductPrice(productId: string, newPrice: number) {
  await db.product.update({ where: { id: productId }, data: { price: newPrice } })
  revalidatePath("/admin/pricing")
  revalidatePath("/admin/products")
}

export async function applyVariantPrice(variantId: string, newPrice: number) {
  await db.productVariant.update({ where: { id: variantId }, data: { price: newPrice } })
  revalidatePath("/admin/pricing")
  revalidatePath("/admin/products")
}

export async function applyBulkPrices(items: { productId: string; newPrice: number }[]) {
  await Promise.all(
    items.map((item) =>
      db.product.update({ where: { id: item.productId }, data: { price: item.newPrice } })
    )
  )
  revalidatePath("/admin/pricing")
  revalidatePath("/admin/products")
}

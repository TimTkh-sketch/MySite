"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export async function reorderProducts(orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) => db.product.update({ where: { id }, data: { sortOrder: index } }))
  )
  revalidatePath("/admin/products")
}

export async function updateVariantImage(id: string, image: string) {
  await db.productVariant.update({ where: { id }, data: { image: image || null } })
}

export async function updateProductPrice(id: string, price: number) {
  await db.product.update({ where: { id }, data: { price } })
  revalidatePath("/admin/products")
}

export async function updateVariantPrice(id: string, price: number) {
  await db.productVariant.update({ where: { id }, data: { price } })
  revalidatePath("/admin/products")
}

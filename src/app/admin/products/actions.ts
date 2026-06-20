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

export async function toggleProductActive(id: string, isActive: boolean) {
  await db.product.update({ where: { id }, data: { isActive } })
  revalidatePath("/admin/products")
}

export async function moveProductToCategory(id: string, newCategoryId: string | null) {
  await db.product.update({ where: { id }, data: { categoryId: newCategoryId } })
  revalidatePath("/admin/products")
}

export async function moveProductToStart(id: string, categoryId: string | null, storeId: string) {
  const siblings = await db.product.findMany({
    where: { storeId, categoryId: categoryId ?? null },
    orderBy: [{ sortOrder: "asc" }],
    select: { id: true },
  })
  const ids = [id, ...siblings.filter((p) => p.id !== id).map((p) => p.id)]
  await Promise.all(ids.map((pid, i) => db.product.update({ where: { id: pid }, data: { sortOrder: i } })))
  revalidatePath("/admin/products")
}

export async function moveProductToEnd(id: string, categoryId: string | null, storeId: string) {
  const siblings = await db.product.findMany({
    where: { storeId, categoryId: categoryId ?? null },
    orderBy: [{ sortOrder: "asc" }],
    select: { id: true },
  })
  const ids = [...siblings.filter((p) => p.id !== id).map((p) => p.id), id]
  await Promise.all(ids.map((pid, i) => db.product.update({ where: { id: pid }, data: { sortOrder: i } })))
  revalidatePath("/admin/products")
}

export async function updateProductPrice(id: string, price: number) {
  await db.product.update({ where: { id }, data: { price } })
  revalidatePath("/admin/products")
}

export async function updateVariantPrice(id: string, price: number) {
  await db.productVariant.update({ where: { id }, data: { price } })
  revalidatePath("/admin/products")
}

export async function bulkToggleActive(ids: string[], isActive: boolean) {
  await db.product.updateMany({ where: { id: { in: ids } }, data: { isActive } })
  revalidatePath("/admin/products")
}

export async function bulkMoveToCategory(ids: string[], categoryId: string | null) {
  await db.product.updateMany({ where: { id: { in: ids } }, data: { categoryId } })
  revalidatePath("/admin/products")
}

export async function bulkDelete(ids: string[]) {
  await db.product.deleteMany({ where: { id: { in: ids } } })
  revalidatePath("/admin/products")
}

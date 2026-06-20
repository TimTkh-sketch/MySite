"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export async function moveProduct(id: string, direction: "up" | "down", categoryId: string | null, storeId: string) {
  // Get all products in this category ordered by sortOrder, then createdAt
  const siblings = await db.product.findMany({
    where: { storeId, categoryId: categoryId ?? null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { id: true, sortOrder: true },
  })

  // Assign sequential sortOrders if they're all 0 (first move)
  const allZero = siblings.every((p) => p.sortOrder === 0)
  let list = siblings
  if (allZero) {
    await Promise.all(
      siblings.map((p, i) => db.product.update({ where: { id: p.id }, data: { sortOrder: i } }))
    )
    list = siblings.map((p, i) => ({ ...p, sortOrder: i }))
  }

  const idx = list.findIndex((p) => p.id === id)
  if (idx === -1) return

  const swapIdx = direction === "up" ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= list.length) return

  const current = list[idx]
  const neighbor = list[swapIdx]

  await Promise.all([
    db.product.update({ where: { id: current.id }, data: { sortOrder: neighbor.sortOrder } }),
    db.product.update({ where: { id: neighbor.id }, data: { sortOrder: current.sortOrder } }),
  ])

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

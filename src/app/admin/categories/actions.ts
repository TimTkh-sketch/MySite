"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function toggleCategoryActive(id: string, isActive: boolean) {
  await db.category.update({ where: { id }, data: { isActive } })
  revalidatePath("/admin/categories")
  revalidatePath("/admin/products")
}

export async function reorderCategories(items: { id: string; sortOrder: number }[]) {
  await Promise.all(
    items.map((item) =>
      db.category.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
    )
  )
  revalidatePath("/admin/categories")
  revalidatePath("/admin/products")
}

export async function moveCategory(id: string, parentId: string | null) {
  await db.category.update({ where: { id }, data: { parentId } })
  revalidatePath("/admin/categories")
}

"use server"

import { db } from "@/lib/db"

export async function getWishlistProducts(storeSlug: string, productIds: string[]) {
  if (!productIds.length) return []

  const store = await db.store.findUnique({
    where: { slug: storeSlug, isActive: true },
    select: { id: true },
  })
  if (!store) return []

  return db.product.findMany({
    where: { storeId: store.id, isActive: true, id: { in: productIds } },
    select: {
      id: true, name: true, slug: true, price: true,
      comparePrice: true, images: true, stock: true, isFeatured: true,
    },
  })
}

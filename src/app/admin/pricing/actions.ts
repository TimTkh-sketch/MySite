"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function applyStoragePrice(
  productId: string,
  storageName: string | null,
  newPrice: number
) {
  if (storageName === null) {
    // No storage distinction — update product base price + all variant prices
    await db.product.update({ where: { id: productId }, data: { price: newPrice } })
    await db.productVariant.updateMany({ where: { productId }, data: { price: newPrice } })
  } else {
    // Update only variants matching this storage value
    const variants = await db.productVariant.findMany({
      where: { productId },
      select: { id: true, value: true },
    })
    const matchingIds = variants
      .filter((v) => {
        try {
          const opts = JSON.parse(v.value) as Record<string, string>
          return opts["Память"] === storageName || opts["Storage"] === storageName
        } catch {
          return false
        }
      })
      .map((v) => v.id)

    if (matchingIds.length > 0) {
      await db.productVariant.updateMany({
        where: { id: { in: matchingIds } },
        data: { price: newPrice },
      })
    }
  }
  revalidatePath("/admin/pricing")
  revalidatePath("/admin/products")
}

export async function applyBulkStoragePrices(
  items: { productId: string; storageName: string | null; newPrice: number }[]
) {
  await Promise.all(
    items.map((item) => applyStoragePrice(item.productId, item.storageName, item.newPrice))
  )
}

// Legacy – kept for backwards compat with any direct calls
export async function applyProductPrice(productId: string, newPrice: number) {
  return applyStoragePrice(productId, null, newPrice)
}

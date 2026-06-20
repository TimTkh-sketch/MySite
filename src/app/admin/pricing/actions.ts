"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

function normalizeSim(sim: string | null | undefined): "esim" | "" {
  if (!sim) return ""
  return sim.toLowerCase().replace(/[\s\-_]/g, "") === "esim" ? "esim" : ""
}

export async function applyStoragePrice(
  productId: string,
  storageName: string | null,
  simGroup: "esim" | "",
  newPrice: number
) {
  if (storageName === null && simGroup === "") {
    // No variation — update product base price + all variant prices
    await db.product.update({ where: { id: productId }, data: { price: newPrice } })
    await db.productVariant.updateMany({ where: { productId }, data: { price: newPrice } })
  } else {
    // Update only variants matching this storage × SIM combination
    const variants = await db.productVariant.findMany({
      where: { productId },
      select: { id: true, value: true },
    })
    const matchingIds = variants
      .filter((v) => {
        try {
          const opts = JSON.parse(v.value) as Record<string, string>
          const vStorage = opts["Память"] ?? opts["Storage"] ?? null
          const vSim = normalizeSim(opts["SIM"] ?? opts["Сим"])
          const storageMatch = storageName === null || vStorage === storageName
          const simMatch = simGroup === "" || vSim === simGroup
          return storageMatch && simMatch
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
  items: { productId: string; storageName: string | null; simGroup: "esim" | ""; newPrice: number }[]
) {
  await Promise.all(
    items.map((item) =>
      applyStoragePrice(item.productId, item.storageName, item.simGroup, item.newPrice)
    )
  )
}

// Legacy – kept for backwards compat with any direct calls
export async function applyProductPrice(productId: string, newPrice: number) {
  return applyStoragePrice(productId, null, "", newPrice)
}

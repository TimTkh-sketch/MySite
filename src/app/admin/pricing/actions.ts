"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

function normalizeSim(sim: string | null | undefined): "esim" | "" {
  if (!sim) return ""
  return sim.toLowerCase().replace(/[\s\-_]/g, "") === "esim" ? "esim" : ""
}

function extractEnglishColor(colorStr: string): string {
  const parenIdx = colorStr.indexOf("(")
  return (parenIdx > 0 ? colorStr.slice(0, parenIdx) : colorStr).trim()
}

export async function applyStoragePrice(
  productId: string,
  storageName: string | null,
  simGroup: "esim" | "",
  colorName: string | null,
  newPrice: number
) {
  // Fully flat product — update everything
  if (!storageName && simGroup === "" && !colorName) {
    await db.product.update({ where: { id: productId }, data: { price: newPrice } })
    await db.productVariant.updateMany({ where: { productId }, data: { price: newPrice } })
    revalidatePath("/admin/pricing")
    revalidatePath("/admin/products")
    return
  }

  // Match variants by storage × SIM × color
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
        const rawColor = opts["Цвет"] ?? opts["Color"] ?? null
        const vColor = rawColor ? extractEnglishColor(rawColor) : null

        const storageOk = storageName === null || vStorage === storageName
        const simOk = simGroup === "" || vSim === simGroup
        const colorOk = colorName === null || vColor === colorName
        return storageOk && simOk && colorOk
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

  revalidatePath("/admin/pricing")
  revalidatePath("/admin/products")
}

export async function applyBulkStoragePrices(
  items: {
    productId: string
    storageName: string | null
    simGroup: "esim" | ""
    colorName: string | null
    newPrice: number
  }[]
) {
  await Promise.all(
    items.map((item) =>
      applyStoragePrice(
        item.productId,
        item.storageName,
        item.simGroup,
        item.colorName,
        item.newPrice
      )
    )
  )
}

// Legacy
export async function applyProductPrice(productId: string, newPrice: number) {
  return applyStoragePrice(productId, null, "", null, newPrice)
}

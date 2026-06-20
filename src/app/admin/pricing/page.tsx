import { db } from "@/lib/db"
import { PricingDashboard } from "@/components/admin/pricing-dashboard"

export interface PricingUnit {
  key: string           // `${productId}::${storageName ?? ''}`
  productId: string
  productName: string
  storageName: string | null
  searchName: string    // used for competitor matching, e.g. "Apple iPhone 16 Pro Max 256 ГБ"
  variantIds: string[]
  currentPrice: number
  storeId: string
}

export default async function PricingPage() {
  const [products, competitorPrices] = await Promise.all([
    db.product.findMany({
      where: { variants: { some: {} } },
      select: {
        id: true,
        name: true,
        price: true,
        storeId: true,
        variants: {
          select: { id: true, price: true, value: true },
        },
      },
      orderBy: { name: "asc" },
      take: 500,
    }),
    db.competitorPrice.findMany({
      where: { competitor: "trade59" },
      orderBy: { scrapedAt: "desc" },
    }),
  ])

  // Build one pricing unit per product × storage size combination
  const units: PricingUnit[] = []

  for (const product of products) {
    const storageGroups = new Map<string | null, { variantIds: string[]; prices: number[] }>()

    for (const variant of product.variants) {
      let storage: string | null = null
      try {
        const opts = JSON.parse(variant.value) as Record<string, string>
        storage = opts["Память"] ?? opts["Storage"] ?? null
      } catch {}

      if (!storageGroups.has(storage)) {
        storageGroups.set(storage, { variantIds: [], prices: [] })
      }
      const group = storageGroups.get(storage)!
      group.variantIds.push(variant.id)
      if (variant.price !== null) group.prices.push(variant.price)
    }

    // If the only key is null (no storage variants) → single unit for product
    const hasStorageVariants = !(storageGroups.size === 1 && storageGroups.has(null))

    if (!hasStorageVariants) {
      const group = storageGroups.get(null)!
      const effectivePrice =
        group.prices.length > 0 ? Math.min(...group.prices) : product.price
      units.push({
        key: `${product.id}::`,
        productId: product.id,
        productName: product.name,
        storageName: null,
        searchName: product.name,
        variantIds: group.variantIds,
        currentPrice: effectivePrice,
        storeId: product.storeId,
      })
    } else {
      for (const [storage, group] of storageGroups) {
        if (storage === null) continue // skip null group when storage variants exist
        const effectivePrice =
          group.prices.length > 0 ? Math.min(...group.prices) : product.price
        units.push({
          key: `${product.id}::${storage}`,
          productId: product.id,
          productName: product.name,
          storageName: storage,
          searchName: `${product.name} ${storage}`,
          variantIds: group.variantIds,
          currentPrice: effectivePrice,
          storeId: product.storeId,
        })
      }
    }
  }

  const lastScraped =
    competitorPrices.length > 0
      ? new Intl.DateTimeFormat("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(competitorPrices[0].scrapedAt)
      : null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мониторинг цен</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Цена = trade59.ru − 500 ₽ · Подтвердите изменения вручную
          </p>
        </div>
        {lastScraped && (
          <p className="text-xs text-gray-400">Обновлено: {lastScraped}</p>
        )}
      </div>

      <PricingDashboard
        units={units}
        competitorPrices={competitorPrices.map((cp) => ({
          itemName: cp.itemName,
          price: cp.price,
          url: cp.url,
        }))}
        trade59Count={competitorPrices.length}
      />
    </div>
  )
}

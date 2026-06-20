import { db } from "@/lib/db"
import { PricingDashboard } from "@/components/admin/pricing-dashboard"

export interface PricingUnit {
  key: string           // `${productId}::${storage ?? ""}::${simGroup}`
  productId: string
  productName: string
  storageName: string | null
  simGroup: "esim" | "" // "" = regular (dual SIM / SIM+eSIM); "esim" = eSIM-only
  searchName: string    // passed to matchScore, e.g. "Apple iPhone 17 Pro Max 256 Гб eSIM"
  variantIds: string[]
  currentPrice: number
  storeId: string
}

// "eSIM" (standalone) → "esim" (eSIM-only)
// "SIM + eSIM", "dual - SIM", anything else → "" (regular)
function normalizeSim(sim: string | null | undefined): "esim" | "" {
  if (!sim) return ""
  return sim.toLowerCase().replace(/[\s\-_]/g, "") === "esim" ? "esim" : ""
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

  // Build one pricing unit per product × storage × SIM combination
  const units: PricingUnit[] = []

  for (const product of products) {
    // key = `${storage ?? ""}::${simGroup}`
    const groups = new Map<
      string,
      { storage: string | null; simGroup: "esim" | ""; variantIds: string[]; prices: number[] }
    >()

    for (const variant of product.variants) {
      let storage: string | null = null
      let simGroup: "esim" | "" = ""
      try {
        const opts = JSON.parse(variant.value) as Record<string, string>
        storage = opts["Память"] ?? opts["Storage"] ?? null
        simGroup = normalizeSim(opts["SIM"] ?? opts["Сим"])
      } catch {}

      const key = `${storage ?? ""}::${simGroup}`
      if (!groups.has(key)) {
        groups.set(key, { storage, simGroup, variantIds: [], prices: [] })
      }
      const g = groups.get(key)!
      g.variantIds.push(variant.id)
      if (variant.price !== null) g.prices.push(variant.price)
    }

    // If only one group with no storage and no SIM → simple unit
    const hasVariation = !(groups.size === 1 && groups.has("::"))

    if (!hasVariation) {
      const g = groups.get("::")!
      const effectivePrice =
        g.prices.length > 0 ? Math.min(...g.prices) : product.price
      units.push({
        key: `${product.id}::::`,
        productId: product.id,
        productName: product.name,
        storageName: null,
        simGroup: "",
        searchName: product.name,
        variantIds: g.variantIds,
        currentPrice: effectivePrice,
        storeId: product.storeId,
      })
      continue
    }

    for (const [gKey, g] of groups) {
      // Skip null-storage groups when storage variants exist
      if (!g.storage && groups.size > 1 && [...groups.values()].some((x) => x.storage)) continue

      const effectivePrice =
        g.prices.length > 0 ? Math.min(...g.prices) : product.price

      const simSuffix = g.simGroup === "esim" ? " eSIM" : ""
      const searchName = g.storage
        ? `${product.name} ${g.storage}${simSuffix}`
        : `${product.name}${simSuffix}`

      units.push({
        key: `${product.id}::${gKey}`,
        productId: product.id,
        productName: product.name,
        storageName: g.storage,
        simGroup: g.simGroup,
        searchName,
        variantIds: g.variantIds,
        currentPrice: effectivePrice,
        storeId: product.storeId,
      })
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

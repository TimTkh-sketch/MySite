import { db } from "@/lib/db"
import { PricingDashboard } from "@/components/admin/pricing-dashboard"

export interface PricingUnit {
  key: string           // `${productId}::${storage}::${simGroup}::${color}`
  productId: string
  productName: string
  storageName: string | null
  simGroup: "esim" | "" // "" = regular (dual / SIM+eSIM); "esim" = eSIM-only
  colorName: string | null  // English part only, e.g. "Cosmic Orange"
  searchName: string    // passed to matchScore
  variantIds: string[]
  currentPrice: number
  storeId: string
}

// "eSIM" standalone → eSIM-only; anything else (SIM+eSIM, dual) → regular ""
function normalizeSim(sim: string | null | undefined): "esim" | "" {
  if (!sim) return ""
  return sim.toLowerCase().replace(/[\s\-_]/g, "") === "esim" ? "esim" : ""
}

// "Cosmic Orange (Оранжевый)" → "Cosmic Orange"; "Silver" → "Silver"
function extractEnglishColor(colorStr: string): string {
  const parenIdx = colorStr.indexOf("(")
  return (parenIdx > 0 ? colorStr.slice(0, parenIdx) : colorStr).trim()
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

  // Build one pricing unit per product × storage × SIM × color combination
  const units: PricingUnit[] = []

  for (const product of products) {
    // group key = `${storage ?? ""}::${simGroup}::${color ?? ""}`
    const groups = new Map<
      string,
      {
        storage: string | null
        simGroup: "esim" | ""
        color: string | null
        variantIds: string[]
        prices: number[]
      }
    >()

    for (const variant of product.variants) {
      let storage: string | null = null
      let simGroup: "esim" | "" = ""
      let color: string | null = null
      try {
        const opts = JSON.parse(variant.value) as Record<string, string>
        storage = opts["Память"] ?? opts["Storage"] ?? null
        simGroup = normalizeSim(opts["SIM"] ?? opts["Сим"])
        const rawColor = opts["Цвет"] ?? opts["Color"] ?? null
        color = rawColor ? extractEnglishColor(rawColor) : null
      } catch {}

      const gKey = `${storage ?? ""}::${simGroup}::${color ?? ""}`
      if (!groups.has(gKey)) {
        groups.set(gKey, { storage, simGroup, color, variantIds: [], prices: [] })
      }
      const g = groups.get(gKey)!
      g.variantIds.push(variant.id)
      if (variant.price !== null) g.prices.push(variant.price)
    }

    // Completely flat product (no storage, no SIM, no color) → single unit
    const isFlat = groups.size === 1 && groups.has("::::")
    if (isFlat) {
      const g = groups.get("::::")!
      units.push({
        key: `${product.id}::::`,
        productId: product.id,
        productName: product.name,
        storageName: null,
        simGroup: "",
        colorName: null,
        searchName: product.name,
        variantIds: g.variantIds,
        currentPrice: g.prices.length > 0 ? Math.min(...g.prices) : product.price,
        storeId: product.storeId,
      })
      continue
    }

    for (const [, g] of groups) {
      const searchName = [
        product.name,
        g.storage,
        g.simGroup === "esim" ? "eSIM" : null,
        g.color,
      ]
        .filter(Boolean)
        .join(" ")

      units.push({
        key: `${product.id}::${g.storage ?? ""}::${g.simGroup}::${g.color ?? ""}`,
        productId: product.id,
        productName: product.name,
        storageName: g.storage,
        simGroup: g.simGroup,
        colorName: g.color,
        searchName,
        variantIds: g.variantIds,
        currentPrice: g.prices.length > 0 ? Math.min(...g.prices) : product.price,
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

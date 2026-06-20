import { db } from "@/lib/db"
import { PricingDashboard } from "@/components/admin/pricing-dashboard"
import { formatPrice } from "@/lib/utils"

export default async function PricingPage() {
  const [products, competitorPrices] = await Promise.all([
    db.product.findMany({
      where: { variants: { some: {} } },
      select: { id: true, name: true, price: true, storeId: true },
      orderBy: { name: "asc" },
      take: 300,
    }),
    db.competitorPrice.findMany({
      where: { competitor: "trade59" },
      orderBy: { scrapedAt: "desc" },
    }),
  ])

  const lastScraped =
    competitorPrices.length > 0
      ? new Intl.DateTimeFormat("ru-RU", {
          day: "2-digit", month: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit",
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
        products={products}
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

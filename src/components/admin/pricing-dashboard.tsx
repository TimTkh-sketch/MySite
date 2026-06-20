"use client"

import { useState, useTransition, useMemo } from "react"
import { RefreshCw, Check, TrendingDown, TrendingUp, Minus, ExternalLink, AlertCircle } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { applyProductPrice, applyBulkPrices } from "@/app/admin/pricing/actions"
import { matchScore } from "@/lib/scraper"

const ADJUSTMENT = -500 // trade59 price - 500

interface Product {
  id: string
  name: string
  price: number
  storeId: string
}

interface CompetitorPrice {
  itemName: string
  price: number
  url: string
}

interface MatchedRow {
  product: Product
  competitorPrice: CompetitorPrice | null
  competitorName: string | null
  suggestedPrice: number | null
  diff: number | null // our price - suggested
}

function buildMatches(products: Product[], competitorPrices: CompetitorPrice[]): MatchedRow[] {
  return products.map((product) => {
    let best: { cp: CompetitorPrice; score: number; name: string } | null = null

    for (const cp of competitorPrices) {
      const score = matchScore(product.name, cp.itemName)
      if (score > 0.55 && (!best || score > best.score)) {
        best = { cp, score, name: cp.itemName }
      }
    }

    if (!best) return { product, competitorPrice: null, competitorName: null, suggestedPrice: null, diff: null }

    const suggestedPrice = best.cp.price + ADJUSTMENT
    const diff = product.price - suggestedPrice

    return {
      product,
      competitorPrice: best.cp,
      competitorName: best.name,
      suggestedPrice,
      diff,
    }
  })
}

function DiffBadge({ diff }: { diff: number }) {
  if (Math.abs(diff) < 100) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <Minus className="h-3 w-3" />в норме
      </span>
    )
  }
  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
        <TrendingUp className="h-3 w-3" />+{formatPrice(diff)} дороже
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
      <TrendingDown className="h-3 w-3" />{formatPrice(diff)} дешевле
    </span>
  )
}

export function PricingDashboard({
  products,
  competitorPrices,
  trade59Count,
}: {
  products: Product[]
  competitorPrices: CompetitorPrice[]
  trade59Count: number
}) {
  const [scraping, setScraping] = useState(false)
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null)
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()
  const [filter, setFilter] = useState<"all" | "needs_change" | "no_match">("all")

  const rows = useMemo(
    () => buildMatches(products, competitorPrices),
    [products, competitorPrices]
  )

  const filtered = useMemo(() => {
    if (filter === "needs_change") return rows.filter((r) => r.diff !== null && Math.abs(r.diff) >= 100)
    if (filter === "no_match") return rows.filter((r) => r.competitorPrice === null)
    return rows
  }, [rows, filter])

  const changesNeeded = rows.filter((r) => r.diff !== null && Math.abs(r.diff) >= 100)

  async function handleScrape() {
    setScraping(true)
    setScrapeMsg(null)
    try {
      const res = await fetch("/api/admin/scrape-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitors: ["trade59"] }),
      })
      const data = await res.json()
      setScrapeMsg(`Обновлено: trade59 — ${data.scraped?.trade59 ?? 0} позиций`)
      // Reload to get fresh data
      window.location.reload()
    } catch {
      setScrapeMsg("Ошибка при парсинге")
    } finally {
      setScraping(false)
    }
  }

  function handleApply(row: MatchedRow) {
    if (!row.suggestedPrice) return
    startTransition(async () => {
      await applyProductPrice(row.product.id, row.suggestedPrice!)
      setApplied((prev) => new Set([...prev, row.product.id]))
    })
  }

  function handleBulkApply() {
    const toApply = filtered
      .filter((r) => selected.has(r.product.id) && r.suggestedPrice && !applied.has(r.product.id))
      .map((r) => ({ productId: r.product.id, newPrice: r.suggestedPrice! }))

    if (toApply.length === 0) return

    startTransition(async () => {
      await applyBulkPrices(toApply)
      setApplied((prev) => new Set([...prev, ...toApply.map((i) => i.productId)]))
      setSelected(new Set())
    })
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function selectAll() {
    const ids = filtered.filter((r) => r.suggestedPrice && !applied.has(r.product.id)).map((r) => r.product.id)
    setSelected(new Set(ids))
  }

  const matchedCount = rows.filter((r) => r.competitorPrice !== null).length

  return (
    <div className="space-y-4">
      {/* Stats + Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{trade59Count}</p>
            <p className="text-xs text-gray-400">позиций у конкурента</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{matchedCount}</p>
            <p className="text-xs text-gray-400">совпадений найдено</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">{changesNeeded.length}</p>
            <p className="text-xs text-gray-400">требуют изменения</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${scraping ? "animate-spin" : ""}`} />
            {scraping ? "Парсим..." : "Обновить цены конкурента"}
          </button>
        </div>
      </div>

      {scrapeMsg && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <Check className="h-4 w-4 shrink-0" />
          {scrapeMsg}
        </div>
      )}

      {trade59Count === 0 && (
        <div className="flex items-center gap-3 px-4 py-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Нет данных о ценах конкурента</p>
            <p className="text-xs mt-0.5 text-orange-500">Нажмите «Обновить цены конкурента» чтобы спарсить trade59.ru</p>
          </div>
        </div>
      )}

      {/* Filters + Bulk action */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {([
            ["all", "Все товары", rows.length],
            ["needs_change", "Нужно обновить", changesNeeded.length],
            ["no_match", "Не найдено", rows.filter((r) => !r.competitorPrice).length],
          ] as const).map(([f, label, count]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                filter === f
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {label} {count > 0 && <span className="ml-1 opacity-70">{count}</span>}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <button
            onClick={handleBulkApply}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
            Применить выбранные ({selected.size})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/40">
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  onChange={(e) => e.target.checked ? selectAll() : setSelected(new Set())}
                  checked={selected.size > 0 && selected.size === filtered.filter((r) => r.suggestedPrice).length}
                  className="w-4 h-4 accent-orange-500 cursor-pointer"
                />
              </th>
              <th className="px-3 py-3">Наш товар</th>
              <th className="px-3 py-3 w-32">Наша цена</th>
              <th className="px-3 py-3 w-36">trade59.ru</th>
              <th className="px-3 py-3 w-36">Предлагаем</th>
              <th className="px-3 py-3 w-32">Разница</th>
              <th className="px-3 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((row) => {
              const isApplied = applied.has(row.product.id)
              const hasChange = row.diff !== null && Math.abs(row.diff) >= 100
              return (
                <tr
                  key={row.product.id}
                  className={`transition-colors ${isApplied ? "bg-green-50/40" : hasChange ? "hover:bg-orange-50/30" : "hover:bg-gray-50/60"}`}
                >
                  <td className="px-3 py-3">
                    {row.suggestedPrice && !isApplied && (
                      <input
                        type="checkbox"
                        checked={selected.has(row.product.id)}
                        onChange={() => toggleSelect(row.product.id)}
                        className="w-4 h-4 accent-orange-500 cursor-pointer"
                      />
                    )}
                    {isApplied && <Check className="h-4 w-4 text-green-500" />}
                  </td>

                  <td className="px-3 py-3">
                    <p className="font-medium text-gray-900 line-clamp-1">{row.product.name}</p>
                    {row.competitorName && (
                      <p className="text-xs text-gray-400 truncate mt-0.5" title={row.competitorName}>
                        ≈ {row.competitorName}
                      </p>
                    )}
                  </td>

                  <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {formatPrice(row.product.price)}
                  </td>

                  <td className="px-3 py-3">
                    {row.competitorPrice ? (
                      <a
                        href={row.competitorPrice.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-gray-700 hover:text-blue-600 transition-colors whitespace-nowrap"
                      >
                        {formatPrice(row.competitorPrice.price)}
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">не найден</span>
                    )}
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">
                    {row.suggestedPrice ? (
                      <span className={`font-semibold ${isApplied ? "text-green-600" : "text-orange-600"}`}>
                        {formatPrice(row.suggestedPrice)}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    {row.diff !== null && <DiffBadge diff={row.diff} />}
                  </td>

                  <td className="px-3 py-3">
                    {row.suggestedPrice && !isApplied && hasChange && (
                      <button
                        onClick={() => handleApply(row)}
                        className="px-3 py-1.5 text-xs font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap"
                      >
                        Принять
                      </button>
                    )}
                    {isApplied && (
                      <span className="text-xs text-green-500 font-medium">Применено</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">
            Нет товаров для отображения
          </div>
        )}
      </div>
    </div>
  )
}

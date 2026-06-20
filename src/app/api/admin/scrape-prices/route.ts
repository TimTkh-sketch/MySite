import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scrapeTrade59, scrapeFlagman } from "@/lib/scraper"

export const maxDuration = 60

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const competitors: string[] = body.competitors ?? ["trade59", "flagman"]

  const results: Record<string, number> = {}

  if (competitors.includes("trade59")) {
    try {
      const items = await scrapeTrade59()
      await Promise.all(
        items.map((item) =>
          db.competitorPrice.upsert({
            where: { competitor_itemName: { competitor: "trade59", itemName: item.itemName } },
            update: { price: item.price, url: item.url, scrapedAt: new Date() },
            create: { competitor: "trade59", itemName: item.itemName, price: item.price, url: item.url },
          })
        )
      )
      results.trade59 = items.length
    } catch (e) {
      console.error("trade59 scrape error", e)
      results.trade59 = -1
    }
  }

  if (competitors.includes("flagman")) {
    try {
      const items = await scrapeFlagman()
      await Promise.all(
        items.map((item) =>
          db.competitorPrice.upsert({
            where: { competitor_itemName: { competitor: "flagman", itemName: item.itemName } },
            update: { price: item.price, url: item.url, scrapedAt: new Date() },
            create: { competitor: "flagman", itemName: item.itemName, price: item.price, url: item.url },
          })
        )
      )
      results.flagman = items.length
    } catch (e) {
      console.error("flagman scrape error", e)
      results.flagman = -1
    }
  }

  return NextResponse.json({ ok: true, scraped: results })
}

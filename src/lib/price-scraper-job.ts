import { scrapeTrade59 } from "./scraper"
import { db } from "./db"

let scheduled = false
const TWO_HOURS = 2 * 60 * 60 * 1000

export function schedulePriceSync() {
  if (scheduled) return
  scheduled = true

  async function runScrape() {
    try {
      console.log("[AutoPrice] Starting scheduled scrape of trade59.ru...")
      const items = await scrapeTrade59()
      for (const item of items) {
        await db.competitorPrice.upsert({
          where: { competitor_itemName: { competitor: "trade59", itemName: item.itemName } },
          update: { price: item.price, url: item.url, scrapedAt: new Date() },
          create: { competitor: "trade59", itemName: item.itemName, price: item.price, url: item.url },
        })
      }
      console.log(`[AutoPrice] Done: ${items.length} prices saved`)
    } catch (e) {
      console.error("[AutoPrice] Error during scheduled scrape:", e)
    }
  }

  // Run every 2 hours
  setInterval(runScrape, TWO_HOURS)
}

#!/usr/bin/env npx tsx
/**
 * Run: cd ecom-platform && npx tsx scripts/scrape-prices.ts
 * Scrapes competitor prices and saves to DB
 */
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env" })
import { scrapeTrade59, scrapeFlagman } from "../src/lib/scraper"

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter } as never)

async function main() {
  console.log("🔍 Парсим trade59.ru...")
  const trade59Items = await scrapeTrade59((msg) => console.log(" ↳", msg))

  if (trade59Items.length === 0) {
    console.log("⚠️  Ничего не нашли на trade59")
  } else {
    console.log(`✅ trade59: найдено ${trade59Items.length} позиций`)
    let saved = 0
    for (const item of trade59Items) {
      await db.competitorPrice.upsert({
        where: { competitor_itemName: { competitor: "trade59", itemName: item.itemName } },
        update: { price: item.price, url: item.url, scrapedAt: new Date() },
        create: { competitor: "trade59", itemName: item.itemName, price: item.price, url: item.url },
      })
      saved++
    }
    console.log(`💾 Сохранено: ${saved}`)
  }

  console.log("\n🔍 Парсим flagman-shop.com (мониторинг)...")
  const flagmanItems = await scrapeFlagman()
  console.log(`✅ flagman: найдено ${flagmanItems.length} позиций`)
  for (const item of flagmanItems) {
    await db.competitorPrice.upsert({
      where: { competitor_itemName: { competitor: "flagman", itemName: item.itemName } },
      update: { price: item.price, url: item.url, scrapedAt: new Date() },
      create: { competitor: "flagman", itemName: item.itemName, price: item.price, url: item.url },
    })
  }

  console.log("\n✅ Готово!")

  // Show a preview of matches
  const ourProducts = await db.product.findMany({
    where: { name: { contains: "iPhone", mode: "insensitive" } },
    select: { name: true, price: true },
    take: 5,
    orderBy: { name: "asc" },
  })
  const compPrices = await db.competitorPrice.findMany({ where: { competitor: "trade59" } })

  const { matchScore } = await import("../src/lib/scraper")
  console.log("\n📊 Примеры совпадений:")
  for (const p of ourProducts) {
    const best = compPrices
      .map((cp: { itemName: string; price: number }) => ({ cp, score: matchScore(p.name, cp.itemName) }))
      .filter((x: { score: number }) => x.score > 0.5)
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)[0]

    if (best) {
      const suggested = best.cp.price - 500
      console.log(
        `  ${p.name}: ${p.price}₽ → trade59: ${best.cp.price}₽ (${best.cp.itemName}) → предлагаем: ${suggested}₽`
      )
    }
  }

  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

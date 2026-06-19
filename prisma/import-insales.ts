/**
 * Import all data from InSales API into our platform.
 * Run: npx tsx prisma/import-insales.ts
 */
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import * as fs from "fs"
import "dotenv/config"

const pool = new Pool({ connectionString: process.env.DATABASE_URL!, max: 8 })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter } as never)

// ─── InSales types ────────────────────────────────────────────────────────────
interface InsalesImage {
  id: number
  large_url: string
  original_url: string
  medium_url: string
  position: number
}

interface InsalesOptionValue {
  title: string
  option_name_id: number
}

interface InsalesVariant {
  title: string
  price: string
  old_price: string | null
  quantity: number | null
  sku: string | null
  option_values: InsalesOptionValue[]
}

interface InsalesOptionName {
  id: number
  title: string
}

interface InsalesProduct {
  id: number
  title: string
  permalink: string
  is_hidden: boolean
  archived: boolean
  available: boolean
  description: string | null
  short_description: string | null
  collections_ids: number[]
  images: InsalesImage[]
  variants: InsalesVariant[]
  option_names: InsalesOptionName[]
}

interface InsalesCollection {
  id: number
  parent_id: number | null
  title: string
  permalink: string
  is_hidden: boolean
  position: number
}

// ─── Load local data ──────────────────────────────────────────────────────────
function loadAllProducts(): InsalesProduct[] {
  const all: InsalesProduct[] = []
  for (let i = 1; i <= 7; i++) {
    const path = `/tmp/insales_products_${i}.json`
    if (fs.existsSync(path)) {
      const data = JSON.parse(fs.readFileSync(path, "utf-8"))
      all.push(...data)
    }
  }
  return all
}

function loadCollections(): InsalesCollection[] {
  return JSON.parse(fs.readFileSync("/tmp/insales_collections.json", "utf-8"))
}

// ─── Category tree ────────────────────────────────────────────────────────────
// Main visible categories under root id=10469645
const MAIN_CATS = [
  { insalesId: 30144177, slug: "apple",             name: "Apple" },
  { insalesId: 30156069, slug: "samsung",           name: "Samsung" },
  { insalesId: 30144194, slug: "xiaomi",            name: "Xiaomi" },
  { insalesId: 30934169, slug: "honor",             name: "HONOR" },
  { insalesId: 30794725, slug: "google",            name: "Google" },
  { insalesId: 46840697, slug: "smartfony",         name: "Смартфоны и гаджеты" },
  { insalesId: 10552079, slug: "aksessuary",        name: "Аксессуары" },
  { insalesId: 46840689, slug: "noutbuki",          name: "Компьютеры и ноутбуки" },
  { insalesId: 46843569, slug: "tv-audio",          name: "ТВ, аудио и видео" },
  { insalesId: 51140001, slug: "uborka",            name: "Техника для уборки" },
  { insalesId: 28693264, slug: "dyson",             name: "Техника Dyson" },
  { insalesId: 46843721, slug: "dom",               name: "Товары для дома" },
  { insalesId: 46844073, slug: "krasota",           name: "Красота и здоровье" },
  { insalesId: 46844265, slug: "razvlecheniya",     name: "Развлечения" },
  { insalesId: 46844465, slug: "sport",             name: "Путешествия и спорт" },
  { insalesId: 54612649, slug: "videokamery",       name: "Видеокамеры" },
]

function buildDescendantMap(cols: InsalesCollection[]): Map<number, Set<number>> {
  const childrenOf = new Map<number, number[]>()
  for (const c of cols) {
    if (c.parent_id != null) {
      if (!childrenOf.has(c.parent_id)) childrenOf.set(c.parent_id, [])
      childrenOf.get(c.parent_id)!.push(c.id)
    }
  }
  function descendants(id: number): Set<number> {
    const result = new Set<number>([id])
    for (const child of childrenOf.get(id) ?? []) {
      for (const d of descendants(child)) result.add(d)
    }
    return result
  }
  const map = new Map<number, Set<number>>()
  for (const mc of MAIN_CATS) map.set(mc.insalesId, descendants(mc.insalesId))
  return map
}

function findPrimaryCategory(
  product: InsalesProduct,
  descendantMap: Map<number, Set<number>>
): number | null {
  for (const mc of MAIN_CATS) {
    const desc = descendantMap.get(mc.insalesId)!
    if (product.collections_ids.some((id) => desc.has(id))) return mc.insalesId
  }
  return null
}

function getSubcategoryId(
  product: InsalesProduct,
  mainInsalesId: number,
  cols: InsalesCollection[]
): number | null {
  const subcats = cols.filter((c) => c.parent_id === mainInsalesId && !c.is_hidden)
  for (const sub of subcats) {
    if (product.collections_ids.includes(sub.id)) return sub.id
  }
  return null
}

// ─── Strip HTML ───────────────────────────────────────────────────────────────
function stripHtml(html: string | null): string {
  if (!html) return ""
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Loading InSales data...")
  const insalesProducts = loadAllProducts()
  const insalesCols = loadCollections()
  const descendantMap = buildDescendantMap(insalesCols)

  const active = insalesProducts.filter((p) => !p.is_hidden && !p.archived)
  console.log(`Total products: ${insalesProducts.length}, active: ${active.length}`)

  // ── Admin user ─────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("admin123", 10)
  const admin = await db.user.upsert({
    where: { email: "admin@myshop.ru" },
    update: {},
    create: { email: "admin@myshop.ru", name: "Администратор", password: hashedPassword, role: "SUPER_ADMIN" },
  })
  console.log("✓ Admin:", admin.email)

  // ── Store ──────────────────────────────────────────────────────────────────
  const store = await db.store.upsert({
    where: { slug: "gadget-market" },
    update: { primaryColor: "#1a1a1a", accentColor: "#FF6B35" },
    create: {
      name: "Гаджет Маркет",
      slug: "gadget-market",
      description: "Самый дружелюбный магазин гаджетов. Работаем с 2012 года.",
      primaryColor: "#1a1a1a",
      accentColor: "#FF6B35",
      settings: {
        create: {
          phone: "+7 (342) 215-43-44",
          address: "г. Пермь, ул. М.Горького, 64/1",
          workingHours: "Ежедневно 10:00-21:00",
          freeShippingFrom: 5000,
          shippingCost: 300,
        },
      },
    },
  })
  console.log("✓ Store:", store.name)

  // ── Banners ────────────────────────────────────────────────────────────────
  await db.banner.deleteMany({ where: { storeId: store.id } })
  await db.banner.createMany({
    data: [
      {
        storeId: store.id,
        title: "Скидка 500₽ на все наушники",
        subtitle: "",
        image: "https://static.insales-cdn.com/files/1/4969/124760937/original/%D0%A1%D0%BA%D0%B8%D0%B4%D0%BA%D0%B0_500___%D0%BD%D0%B0_%D0%B2%D1%81%D0%B5_%D0%9D%D0%90%D0%A3%D0%A8%D0%9D%D0%98%D0%9A%D0%98__1_.png",
        link: "/store/gadget-market/catalog?category=tv-audio",
        sortOrder: 0,
        isActive: true,
      },
      {
        storeId: store.id,
        title: "Apple",
        subtitle: "",
        image: "https://static.insales-cdn.com/files/1/3977/106778505/original/apple1__1_.png",
        link: "/store/gadget-market/catalog?category=apple",
        sortOrder: 1,
        isActive: true,
      },
      {
        storeId: store.id,
        title: "Samsung",
        subtitle: "",
        image: "https://static.insales-cdn.com/files/1/3985/106778513/original/Samsung.png",
        link: "/store/gadget-market/catalog?category=samsung",
        sortOrder: 2,
        isActive: true,
      },
      {
        storeId: store.id,
        title: "Xiaomi",
        subtitle: "",
        image: "https://static.insales-cdn.com/files/1/4065/108351457/original/2025-12-03_11.38.31.jpg",
        link: "/store/gadget-market/catalog?category=xiaomi",
        sortOrder: 3,
        isActive: true,
      },
      {
        storeId: store.id,
        title: "Dyson",
        subtitle: "",
        image: "https://static.insales-cdn.com/files/1/4073/108351465/original/2025-12-03_11.39.28.jpg",
        link: "/store/gadget-market/catalog?category=dyson",
        sortOrder: 4,
        isActive: true,
      },
    ],
  })
  console.log("✓ Banners: 5")

  // ── Categories ─────────────────────────────────────────────────────────────
  await db.product.deleteMany({ where: { storeId: store.id } })
  await db.category.deleteMany({ where: { storeId: store.id } })

  // insalesId → our DB id
  const catDbId = new Map<number, string>()

  for (let i = 0; i < MAIN_CATS.length; i++) {
    const mc = MAIN_CATS[i]
    const cat = await db.category.create({
      data: {
        storeId: store.id,
        name: mc.name,
        slug: mc.slug,
        sortOrder: i,
        isActive: true,
      },
    })
    catDbId.set(mc.insalesId, cat.id)

    // Subcategories
    const subcats = insalesCols
      .filter((c) => c.parent_id === mc.insalesId && !c.is_hidden)
      .sort((a, b) => a.position - b.position)

    for (let j = 0; j < subcats.length; j++) {
      const sub = subcats[j]
      const slugified = sub.permalink
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 60)
      const subCat = await db.category.create({
        data: {
          storeId: store.id,
          parentId: cat.id,
          name: sub.title,
          slug: `${mc.slug}-${slugified}`,
          sortOrder: j,
          isActive: true,
        },
      })
      catDbId.set(sub.id, subCat.id)
    }
  }
  console.log(`✓ Categories: ${catDbId.size}`)

  // ── Products ───────────────────────────────────────────────────────────────
  let imported = 0
  let skipped = 0

  const BATCH = 20
  const chunks: InsalesProduct[][] = []
  const toImport = active.filter((p) => p.images.length > 0 && p.variants.length > 0)

  for (let i = 0; i < toImport.length; i += BATCH) {
    chunks.push(toImport.slice(i, i + BATCH))
  }

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (p) => {
        const mainInsalesId = findPrimaryCategory(p, descendantMap)
        if (!mainInsalesId) { skipped++; return }

        const subInsalesId = getSubcategoryId(p, mainInsalesId, insalesCols)

        // Category: prefer subcategory, fallback to main
        const categoryDbId = subInsalesId
          ? (catDbId.get(subInsalesId) ?? catDbId.get(mainInsalesId)!)
          : catDbId.get(mainInsalesId)!

        // Min price across all variants
        const allPrices = p.variants.map((v) => parseFloat(v.price)).filter((x) => !isNaN(x))
        const price = Math.round(Math.min(...allPrices))
        // Compare price from first variant with old_price
        const firstWithOld = p.variants.find((v) => v.old_price)
        const comparePrice = firstWithOld ? Math.round(parseFloat(firstWithOld.old_price!)) : null
        // Total stock
        const stock = p.variants.reduce((sum, v) => sum + (v.quantity ?? 0), 0) || 100

        const images = p.images
          .sort((a, b) => a.position - b.position)
          .map((img) => img.large_url || img.original_url)
          .filter(Boolean)

        const description = p.description || p.short_description || ""
        const slug = p.permalink.slice(0, 80)

        try {
          const saved = await db.product.upsert({
            where: { storeId_slug: { storeId: store.id, slug } },
            update: { price, comparePrice, stock, images, description, categoryId: categoryDbId },
            create: {
              storeId: store.id,
              categoryId: categoryDbId,
              name: p.title,
              slug,
              price,
              comparePrice,
              stock,
              isActive: true,
              isFeatured: false,
              images,
              description,
            },
          })

          // Save variants (color/storage/sim options)
          const hasOptions = p.option_names.length > 0 && p.variants.some((v) => v.option_values.length > 0)
          if (hasOptions) {
            await db.productVariant.deleteMany({ where: { productId: saved.id } })
            const optionNameMap = new Map(p.option_names.map((o) => [o.id, o.title]))
            await db.productVariant.createMany({
              data: p.variants.map((v) => {
                const opts: Record<string, string> = {}
                for (const ov of v.option_values) {
                  const name = optionNameMap.get(ov.option_name_id)
                  if (name) opts[name] = ov.title
                }
                return {
                  productId: saved.id,
                  name: v.title || Object.values(opts).join(" / "),
                  value: JSON.stringify(opts),
                  price: parseFloat(v.price),
                  stock: v.quantity ?? 0,
                  sku: v.sku ?? null,
                }
              }),
            })
          }
          imported++
        } catch {
          skipped++
        }
      })
    )
    process.stdout.write(`\r  Products: ${imported} imported, ${skipped} skipped...`)
  }

  console.log(`\n✓ Products: ${imported} imported, ${skipped} skipped`)

  // Mark featured: top products with images by price (flagship)
  const featured = await db.product.findMany({
    where: { storeId: store.id, isActive: true, stock: { gt: 0 } },
    orderBy: { price: "desc" },
    take: 20,
    select: { id: true },
  })
  await db.product.updateMany({
    where: { id: { in: featured.map((p) => p.id) } },
    data: { isFeatured: true },
  })
  console.log("✓ Featured: 20 top products marked")

  console.log("\n─────────────────────────────────")
  console.log(" Логин:  admin@myshop.ru")
  console.log(" Пароль: admin123")
  console.log(" Магазин: http://localhost:3000/store/gadget-market")
  console.log("─────────────────────────────────")
}

main().catch(console.error).finally(() => db.$disconnect())

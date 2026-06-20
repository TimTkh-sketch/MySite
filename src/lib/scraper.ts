// Price scraper for competitor sites

export interface ScrapedPrice {
  itemName: string
  price: number
  url: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/[^\d]/g, "")
  const n = parseInt(cleaned)
  return n > 5000 && n < 10_000_000 ? n : null
}

async function parallel<T>(items: T[], fn: (item: T) => Promise<void>, concurrency = 5) {
  let i = 0
  async function next() {
    while (i < items.length) {
      const item = items[i++]
      await fn(item)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next))
}

// ── trade59.ru ────────────────────────────────────────────────────────────────
const TRADE59_BASE = "https://trade59.ru"
// Top-level phone category IDs: iPhone=7, Samsung=8, Xiaomi=117
const TRADE59_ROOT_CIDS = [7, 8, 117]

function extractCatLinks(html: string): Array<{ cid: number; name: string }> {
  const regex = /<a class="cat_item_color" href="catalog\.html\?cid=(\d+)" title="([^"]+)"/g
  const results: Array<{ cid: number; name: string }> = []
  let m
  while ((m = regex.exec(html)) !== null) {
    results.push({ cid: parseInt(m[1]), name: m[2].trim() })
  }
  return results
}

function extractPrices(html: string, categoryName: string, url: string): ScrapedPrice[] {
  // Trade59 structure: <div class="price">PRICE р. ... title="Купить PRODUCT_NAME"
  const pattern = /<div class="price">\s*([\d\s]+)\s*р\.[\s\S]{0,500}?title="Купить ([^"]+)"/g
  const results: ScrapedPrice[] = []
  let m

  while ((m = pattern.exec(html)) !== null) {
    const price = parsePrice(m[1])
    const name = m[2].trim()
    if (price && name.length > 5) {
      results.push({ itemName: name, price, url })
    }
  }

  if (results.length === 0) {
    // Fallback: just grab min price for this category
    const prices = [...html.matchAll(/<div class="price">\s*([\d\s]+)\s*р\./g)]
      .map((pm) => parsePrice(pm[1]))
      .filter(Boolean) as number[]
    if (prices.length > 0) {
      results.push({ itemName: categoryName, price: Math.min(...prices), url })
    }
  }

  return results
}

export async function scrapeTrade59(onProgress?: (msg: string) => void): Promise<ScrapedPrice[]> {
  const all: ScrapedPrice[] = []

  // Step 1: Get model categories (level 1)
  const modelCats: Array<{ cid: number; name: string }> = []
  await parallel(TRADE59_ROOT_CIDS, async (rootCid) => {
    try {
      const html = await fetchHtml(`${TRADE59_BASE}/catalog.html?cid=${rootCid}`)
      const cats = extractCatLinks(html)
      modelCats.push(...cats)
      onProgress?.(`Нашли ${cats.length} моделей в категории ${rootCid}`)
    } catch (e) {
      onProgress?.(`Ошибка категории ${rootCid}: ${e}`)
    }
  }, 3)

  // Step 2: For each model, get memory subcategories (or it's already a leaf)
  const leafPages: Array<{ cid: number; name: string }> = []

  await parallel(modelCats, async (modelCat) => {
    try {
      const html = await fetchHtml(`${TRADE59_BASE}/catalog.html?cid=${modelCat.cid}`)
      const subcats = extractCatLinks(html)
      if (subcats.length > 0) {
        leafPages.push(...subcats)
      } else {
        // Has products directly — treat as leaf
        leafPages.push(modelCat)
      }
    } catch {}
  }, 5)

  onProgress?.(`Найдено ${leafPages.length} листовых страниц, собираем цены...`)

  // Step 3: Scrape all leaf pages in parallel
  await parallel(leafPages, async (leaf) => {
    try {
      const url = `${TRADE59_BASE}/catalog.html?cid=${leaf.cid}`
      const html = await fetchHtml(url)
      // Don't recurse if this page also has subcategories
      const subcats = extractCatLinks(html)
      if (subcats.length > 0) {
        // Go one more level deeper
        await parallel(subcats, async (sub) => {
          try {
            const subUrl = `${TRADE59_BASE}/catalog.html?cid=${sub.cid}`
            const subHtml = await fetchHtml(subUrl)
            const items = extractPrices(subHtml, sub.name, subUrl)
            all.push(...items)
          } catch {}
        }, 3)
      } else {
        const items = extractPrices(html, leaf.name, url)
        all.push(...items)
      }
    } catch {}
  }, 5)

  onProgress?.(`Итого: ${all.length} позиций`)
  return deduplicateByMinPrice(all)
}

// ── flagman-shop.com ──────────────────────────────────────────────────────────
const FLAGMAN_BASE = "https://flagman-shop.com"
const FLAGMAN_CATS = [
  "/catalog/smartfony/iphone/",
  "/catalog/smartfony/samsung/",
]

function extractFlagmanPrices(html: string, baseUrl: string): ScrapedPrice[] {
  const results: ScrapedPrice[] = []

  // Pattern: find price numbers (XX XXX ₽ or XX&nbsp;XXX&nbsp;&#8381;)
  const priceRegex = /(\d[\d\s\xa0&;#nbsp]{3,12})\s*(?:&#8381;|₽)/g
  const nameRegex = /(?:class="[^"]*(?:name|title)[^"]*"[^>]*>|<h2[^>]*>)\s*<a[^>]*>([^<]{5,80})<\/a>/g

  const names: string[] = []
  const prices: number[] = []

  let m
  while ((m = nameRegex.exec(html)) !== null) {
    const name = m[1].replace(/&[^;]+;/g, "").trim()
    if (name.length > 3) names.push(name)
  }
  while ((m = priceRegex.exec(html)) !== null) {
    const p = parsePrice(m[1])
    if (p) prices.push(p)
  }

  for (let i = 0; i < Math.min(names.length, prices.length); i++) {
    results.push({ itemName: names[i], price: prices[i], url: baseUrl })
  }
  return results
}

export async function scrapeFlagman(): Promise<ScrapedPrice[]> {
  const all: ScrapedPrice[] = []

  await parallel(FLAGMAN_CATS, async (cat) => {
    try {
      const url = FLAGMAN_BASE + cat
      const html = await fetchHtml(url)
      const items = extractFlagmanPrices(html, url)
      all.push(...items)
    } catch {}
  }, 2)

  return deduplicateByMinPrice(all)
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function deduplicateByMinPrice(items: ScrapedPrice[]): ScrapedPrice[] {
  const map = new Map<string, ScrapedPrice>()
  for (const item of items) {
    const key = item.itemName.toLowerCase()
    const existing = map.get(key)
    if (!existing || item.price < existing.price) map.set(key, item)
  }
  return [...map.values()]
}

// ── Name matching ─────────────────────────────────────────────────────────────

export function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/apple\s+/gi, "")
    .replace(/samsung\s+galaxy\s+/gi, "samsung ")
    .replace(/(\d+)\s*гб/gi, "$1gb")
    .replace(/(\d+)\s*тб/gi, "$1tb")
    .replace(/\s*(esim|e-sim|esim-only|dual.?sim|sim\s*\+\s*esim|nano-sim)\s*/gi, " ")
    .replace(/[^a-z0-9]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function matchScore(ourName: string, competitorName: string): number {
  const our = normalizeProductName(ourName)
  const comp = normalizeProductName(competitorName)

  const ourTokens = our.split(" ").filter((t) => t.length > 1)
  const compSet = new Set(comp.split(" ").filter((t) => t.length > 1))

  const matches = ourTokens.filter((t) => compSet.has(t))
  return matches.length / Math.max(ourTokens.length, 1)
}

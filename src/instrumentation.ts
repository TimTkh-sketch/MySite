export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { schedulePriceSync } = await import("./lib/price-scraper-job")
    schedulePriceSync()
  }
}

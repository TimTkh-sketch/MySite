import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/store/product-card"
import { BannerCarousel } from "@/components/store/banner-carousel"
import { MiniBanners } from "@/components/store/mini-banners"
import { HeroCarousel } from "@/components/store/hero-carousel"
import { ScrollReveal } from "@/components/store/scroll-reveal"
import { CountUp } from "@/components/store/count-up"
import { AnimatedSection } from "@/components/ui/animated-section"
import { formatPrice } from "@/lib/utils"

function catLabel(name: string) {
  const n = name.toLowerCase()
  if (n.includes("apple") || n.includes("iphone")) return "🍎"
  if (n.includes("samsung")) return "📱"
  if (n.includes("xiaomi") || n.includes("redmi")) return "⚡"
  if (n.includes("наушник") || n.includes("audio")) return "🎧"
  if (n.includes("ноутбук")) return "💻"
  if (n.includes("планшет")) return "📟"
  if (n.includes("часы") || n.includes("watch")) return "⌚"
  return "📦"
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const store = await db.store.findUnique({
    where: { slug, isActive: true },
    include: {
      banners: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, type: true, title: true, subtitle: true, image: true, link: true, buttonText: true },
      },
      categories: {
        where: { isActive: true, parentId: null },
        orderBy: { sortOrder: "asc" },
        take: 12,
        include: { _count: { select: { products: { where: { isActive: true } } } } },
      },
      settings: true,
    },
  })
  if (!store) notFound()

  const [featuredProducts, newProducts, totalCount] = await Promise.all([
    db.product.findMany({ where: { storeId: store.id, isActive: true, isFeatured: true }, orderBy: { price: "desc" }, take: 9 }),
    db.product.findMany({ where: { storeId: store.id, isActive: true }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.product.count({ where: { storeId: store.id, isActive: true } }),
  ])

  const heroBanners = store.banners.filter((b) => (b as { type: string }).type !== "mini")
  const miniBanners = store.banners.filter((b) => (b as { type: string }).type === "mini")
  const base = `/store/${slug}`
  const carouselProducts = [...featuredProducts, ...newProducts.filter(p => !featuredProducts.find(f => f.id === p.id))].slice(0, 8)

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ══ HERO ═════════════════════════════════════════════════ */}
      {carouselProducts.length > 0 ? (
        <HeroCarousel products={carouselProducts} storeSlug={slug} storeName={store.name} />
      ) : (
        <div className="min-h-[60vh] flex items-center justify-center px-6 pt-20">
          <div className="text-center">
            <p className="label-tag mb-4">Магазин пуст</p>
            <p className="text-[#999] text-sm">Добавьте товары в магазин</p>
          </div>
        </div>
      )}

      {/* ══ CATEGORIES ═══════════════════════════════════════════ */}
      {store.categories.length > 0 && (
        <section className="py-20 sm:py-28 bg-[#f7f7f7]">
          <div className="max-w-7xl mx-auto px-6 sm:px-10">
            <AnimatedSection>
              <div className="mb-10">
                <p className="label-tag mb-3">— РАЗДЕЛЫ</p>
                <h2
                  className="font-bold text-[#0a0a0a] tracking-tight leading-none"
                  style={{ fontSize: "clamp(36px, 5vw, 72px)", letterSpacing: "-0.03em" }}
                >
                  Что ищете?
                </h2>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="flex flex-wrap gap-2.5">
                <Link
                  href={`${base}/catalog`}
                  className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
                  style={{ borderRadius: 100 }}
                >
                  Все · {totalCount}+
                </Link>
                {store.categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`${base}/catalog?category=${cat.slug}`}
                    className="btn-glass flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
                    style={{ borderRadius: 100 }}
                  >
                    <span>{catLabel(cat.name)}</span>
                    {cat.name}
                    {cat._count.products > 0 && (
                      <span className="opacity-40 text-xs">{cat._count.products}</span>
                    )}
                  </Link>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ══ BANNERS ══════════════════════════════════════════════ */}
      {heroBanners.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8">
          <BannerCarousel banners={heroBanners as never} />
        </div>
      )}

      {/* ══ FEATURED — ХИТЫ ПРОДАЖ ═══════════════════════════════ */}
      {featuredProducts.length > 0 && (
        <section className="py-20 sm:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-10">

            {/* Section header */}
            <AnimatedSection>
              <div className="relative mb-12 sm:mb-16">
                {/* Editorial bg number */}
                <div
                  className="editorial-num absolute -top-4 -left-4 sm:-left-6 pointer-events-none select-none z-0"
                >
                  01
                </div>
                <div className="relative z-10">
                  <p className="label-tag mb-4">— ПОПУЛЯРНОЕ</p>
                  <div className="flex items-end justify-between gap-4">
                    <h2
                      className="font-bold text-[#0a0a0a] tracking-tight leading-none"
                      style={{ fontSize: "clamp(36px, 5.5vw, 80px)", letterSpacing: "-0.03em" }}
                    >
                      Хиты продаж
                    </h2>
                    <Link
                      href={`${base}/catalog?featured=1`}
                      className="label-tag text-[#999] hover:text-[#F26522] flex items-center gap-1 transition-colors shrink-0 pb-2"
                    >
                      ВСЕ <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Top featured — wide card */}
            {featuredProducts[0] && (
              <AnimatedSection direction="scale" className="mb-6">
                <Link
                  href={`${base}/product/${featuredProducts[0].slug}`}
                  className="group block overflow-hidden rounded-3xl bg-[#f7f7f7] hover:bg-[#f0f0f0] transition-colors duration-500"
                  style={{ minHeight: 300 }}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="relative sm:w-80 lg:w-96 aspect-square sm:aspect-auto shrink-0 flex items-center justify-center p-8 lg:p-12">
                      <div
                        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ background: "radial-gradient(ellipse at center, rgba(242,101,34,0.06) 0%, transparent 70%)" }}
                      />
                      {featuredProducts[0].images[0] && (
                        <div
                          className="relative w-full h-full"
                          style={{ maxWidth: 280, maxHeight: 280 }}
                        >
                          <Image
                            src={featuredProducts[0].images[0]}
                            alt={featuredProducts[0].name}
                            fill
                            className="object-contain drop-shadow-2xl animate-float"
                            sizes="(max-width: 640px) 80vw, 320px"
                          />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col justify-between p-8 sm:p-10 lg:p-14">
                      <div>
                        <span className="label-tag opacity-50 block mb-4">01 · HOT DROP</span>
                        <h3
                          className="font-bold text-[#0a0a0a] leading-tight tracking-tight mb-4"
                          style={{ fontSize: "clamp(24px, 3.5vw, 48px)", letterSpacing: "-0.02em" }}
                        >
                          {featuredProducts[0].name}
                        </h3>
                        <p
                          className="font-black text-[#0a0a0a]"
                          style={{ fontSize: "clamp(28px, 4vw, 52px)", letterSpacing: "-0.02em" }}
                        >
                          {formatPrice(featuredProducts[0].price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-8">
                        <span className="btn-primary px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2">
                          Подробнее <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            )}

            {/* Product grid */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.slice(1).map((p, i) => (
                <ProductCard key={p.id} product={p} storeSlug={slug} index={i + 1} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ MINI BANNERS ══════════════════════════════════════════ */}
      {miniBanners.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-6">
          <MiniBanners banners={miniBanners as never} />
        </div>
      )}

      {/* ══ NEW ARRIVALS ══════════════════════════════════════════ */}
      {newProducts.length > 0 && (
        <section className="py-20 sm:py-32 bg-[#f7f7f7]">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection>
              <div className="px-6 sm:px-10 relative mb-12">
                <div
                  className="editorial-num absolute -top-4 right-4 pointer-events-none select-none z-0"
                >
                  02
                </div>
                <div className="relative z-10">
                  <p className="label-tag mb-4">— СВЕЖЕЕ</p>
                  <div className="flex items-end justify-between gap-4">
                    <h2
                      className="font-bold text-[#0a0a0a] tracking-tight leading-none"
                      style={{ fontSize: "clamp(36px, 5.5vw, 80px)", letterSpacing: "-0.03em" }}
                    >
                      Новинки
                    </h2>
                    <Link
                      href={`${base}/catalog`}
                      className="label-tag text-[#999] hover:text-[#F26522] flex items-center gap-1 transition-colors shrink-0 pb-2"
                    >
                      КАТАЛОГ <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Horizontal scroll */}
            <div
              className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 px-6 sm:px-10 snap-x snap-mandatory"
              style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            >
              {newProducts.map((p, i) => (
                <div key={p.id} className="w-[180px] sm:w-[220px] lg:w-[260px] shrink-0 snap-start">
                  <ProductCard product={p} storeSlug={slug} index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ STATS ═════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <AnimatedSection>
            <div className="relative mb-12 sm:mb-16">
              <div
                className="editorial-num absolute -top-4 -left-4 sm:-left-6 pointer-events-none select-none z-0"
              >
                03
              </div>
              <div className="relative z-10">
                <p className="label-tag mb-3">— ЦИФРЫ</p>
                <h2
                  className="font-bold text-[#0a0a0a] tracking-tight leading-none"
                  style={{ fontSize: "clamp(36px, 5vw, 72px)", letterSpacing: "-0.03em" }}
                >
                  Мы в цифрах
                </h2>
              </div>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#e8e8e8]">
            {[
              { label: "Товаров в каталоге", value: totalCount, suffix: "+" },
              { label: "Лет на рынке",       value: 12,         suffix: "" },
              { label: "Заказов в день",      value: 50,         suffix: "+" },
              { label: "Гарантия качества",   value: 100,        suffix: "%" },
            ].map(({ label, value, suffix }, i) => (
              <ScrollReveal key={label} delay={i * 80} type="scale">
                <div className="bg-white px-8 py-10 sm:py-14">
                  <p
                    className="font-black text-[#F26522] leading-none tracking-tight mb-2"
                    style={{ fontSize: "clamp(40px, 6vw, 80px)", letterSpacing: "-0.03em" }}
                  >
                    <CountUp target={value} suffix={suffix} />
                  </p>
                  <p className="text-[13px] text-[#888] font-medium">{label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

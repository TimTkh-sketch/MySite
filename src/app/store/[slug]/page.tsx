import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ArrowUpRight, Truck, ShieldCheck, Star } from "lucide-react"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/store/product-card"
import { BannerCarousel } from "@/components/store/banner-carousel"
import { MiniBanners } from "@/components/store/mini-banners"
import { HeroCarousel } from "@/components/store/hero-carousel"
import { CountUp } from "@/components/store/count-up"
import { ScrollReveal } from "@/components/store/scroll-reveal"
import { FadeUp, StaggerContainer, StaggerChild, Marquee, SlideFromLeft, SlideFromRight } from "@/components/store/motion"
import { formatPrice } from "@/lib/utils"

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

  const tickerItems = ["БЕСПЛАТНАЯ ДОСТАВКА", "ГАРАНТИЯ 2 ГОДА", "ОРИГИНАЛЬНАЯ ТЕХНИКА", "12 ЛЕТ НА РЫНКЕ", "ОФИЦИАЛЬНЫЙ ДИЛЕР", "СЕРВИСНЫЙ ЦЕНТР"]

  return (
    <div className="min-h-screen" style={{ background: "#000", overflowX: "hidden" }}>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      {carouselProducts.length > 0 ? (
        <HeroCarousel products={carouselProducts} storeSlug={slug} storeName={store.name} />
      ) : (
        <div className="min-h-[60vh] flex items-center justify-center px-6" style={{ paddingTop: 60 }}>
          <div className="text-center">
            <p className="label-tag mb-4">Магазин пуст</p>
            <p style={{ fontSize: 15, color: "var(--text-2)" }}>Добавьте товары в магазин</p>
          </div>
        </div>
      )}

      {/* ══ TICKER ══════════════════════════════════════════════ */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0A0A0A" }}>
        <Marquee speed={50}>
          <div className="flex items-center" style={{ whiteSpace: "nowrap" }}>
            {tickerItems.map(text => (
              <span key={text} className="flex items-center" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.28)", padding: "14px 32px" }}>
                {text}
                <span style={{ color: "var(--accent)", marginLeft: 32, marginRight: 0 }}>·</span>
              </span>
            ))}
          </div>
        </Marquee>
      </div>

      {/* ══ CATEGORIES ══════════════════════════════════════════ */}
      {store.categories.length > 0 && (
        <section style={{ background: "#000", padding: "120px 0" }}>
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

            <SlideFromLeft className="mb-16">
              <p className="label-tag mb-4">— Разделы</p>
              <h2
                style={{
                  fontSize: "clamp(52px, 9vw, 110px)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  lineHeight: 0.88,
                  color: "#fff",
                }}
              >
                Что<br /><span style={{ color: "var(--accent)" }}>ищете?</span>
              </h2>
            </SlideFromLeft>

            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <StaggerChild>
                <Link href={`${base}/catalog`} className="cat-card-dark">
                  <div>
                    <p className="label-tag mb-2" style={{ color: "var(--accent)" }}>Весь каталог</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>Все товары</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 13, color: "var(--text-2)" }}>{totalCount}+ позиций</span>
                    <ArrowUpRight className="h-5 w-5" style={{ color: "var(--accent)" }} />
                  </div>
                </Link>
              </StaggerChild>

              {store.categories.map((cat) => (
                <StaggerChild key={cat.id}>
                  <Link href={`${base}/catalog?category=${cat.slug}`} className="cat-card">
                    <div>
                      <p style={{ fontSize: 19, fontWeight: 700, color: "#fff" }}>{cat.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 12, color: "var(--text-3)" }}>{cat._count.products} товаров</span>
                      <ArrowUpRight className="cat-arrow h-4 w-4" style={{ color: "var(--accent)" }} />
                    </div>
                  </Link>
                </StaggerChild>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* ══ BANNERS ═════════════════════════════════════════════ */}
      {heroBanners.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-8">
          <BannerCarousel banners={heroBanners as never} />
        </div>
      )}

      {/* ══ FEATURED ════════════════════════════════════════════ */}
      {featuredProducts.length > 0 && (
        <section style={{ background: "#0A0A0A", padding: "120px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

            <FadeUp className="mb-12">
              <div className="flex items-end justify-between">
                <div>
                  <p className="label-tag mb-4">— Популярное</p>
                  <h2 style={{ fontSize: "clamp(44px, 8vw, 100px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.88, color: "#fff" }}>
                    Хиты<br /><span style={{ color: "var(--accent)" }}>продаж</span>
                  </h2>
                </div>
                <Link href={`${base}/catalog?featured=1`} className="hidden sm:flex items-center gap-1.5 pb-2" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", textDecoration: "none" }}>
                  Все <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </FadeUp>

            {/* Top featured */}
            {featuredProducts[0] && (
              <FadeUp delay={0.1} className="mb-4">
                <Link href={`${base}/product/${featuredProducts[0].slug}`} className="featured-hero-card">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative sm:w-72 lg:w-96 aspect-square sm:aspect-auto shrink-0 flex items-center justify-center p-10" style={{ background: "#000" }}>
                      {featuredProducts[0].images[0] && (
                        <div className="relative w-full h-full" style={{ maxWidth: 280, maxHeight: 280 }}>
                          <Image
                            src={featuredProducts[0].images[0]}
                            alt={featuredProducts[0].name}
                            fill
                            className="object-contain animate-float"
                            sizes="(max-width: 640px) 80vw, 320px"
                            style={{ filter: "drop-shadow(0 0 40px rgba(0,204,255,0.20))" }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-between p-8 sm:p-10 lg:p-14">
                      <div>
                        <span className="label-tag block mb-4" style={{ opacity: 0.6 }}>01 · ХИТ ПРОДАЖ</span>
                        <h3 style={{ fontSize: "clamp(22px, 3.5vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 0.92, color: "#fff", marginBottom: 16 }}>
                          {featuredProducts[0].name}
                        </h3>
                        <p style={{ fontSize: "clamp(26px, 4vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--accent)" }}>
                          {formatPrice(featuredProducts[0].price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-8">
                        <span className="btn-primary" style={{ fontSize: 14 }}>
                          Подробнее <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            )}

            <StaggerContainer className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.slice(1).map((p, i) => (
                <StaggerChild key={p.id}>
                  <ProductCard product={p} storeSlug={slug} index={i + 1} />
                </StaggerChild>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* ══ MINI BANNERS ════════════════════════════════════════ */}
      {miniBanners.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6">
          <MiniBanners banners={miniBanners as never} />
        </div>
      )}

      {/* ══ ПОЧЕМУ МЫ ═══════════════════════════════════════════ */}
      <section style={{ background: "#000", padding: "140px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <FadeUp className="mb-16">
            <p className="label-tag mb-4">— Преимущества</p>
            <h2 style={{ fontSize: "clamp(44px, 8vw, 100px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.88, color: "#fff" }}>
              Почему<br /><span style={{ color: "var(--accent)" }}>выбирают нас</span>
            </h2>
          </FadeUp>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { icon: Truck,       num: "01", title: "Быстрая доставка",    text: "Доставляем по городу в день заказа" },
              { icon: ShieldCheck, num: "02", title: "Оригинальная техника", text: "Только официальные поставщики, без подделок" },
              { icon: Star,        num: "03", title: "Гарантия 2 года",      text: "Полное сервисное обслуживание включено" },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <ScrollReveal key={i} delay={i * 80}>
                  <div
                    style={{
                      padding: "56px 40px",
                      borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 32, textTransform: "uppercase" as const }}>
                      {item.num}
                    </p>
                    <Icon className="h-8 w-8 mb-6" style={{ color: "var(--accent)" }} strokeWidth={1.5} />
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: "-0.01em" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.6 }}>
                      {item.text}
                    </div>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══ NEW ARRIVALS ════════════════════════════════════════ */}
      {newProducts.length > 0 && (
        <section style={{ background: "#0A0A0A", padding: "120px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="max-w-[1400px] mx-auto">
            <FadeUp>
              <div className="px-6 lg:px-10 flex items-end justify-between mb-12">
                <div>
                  <p className="label-tag mb-4">— Свежее</p>
                  <h2 style={{ fontSize: "clamp(44px, 8vw, 100px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.88, color: "#fff" }}>
                    Нов<span style={{ color: "var(--accent)" }}>инки</span>
                  </h2>
                </div>
                <Link href={`${base}/catalog`} className="hidden sm:flex items-center gap-1.5 pb-2" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", textDecoration: "none" }}>
                  Каталог <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </FadeUp>

            <div
              className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-4 px-6 lg:px-10 snap-x snap-mandatory"
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

      {/* ══ STATS ═══════════════════════════════════════════════ */}
      <section style={{ background: "#000", padding: "120px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <FadeUp className="mb-16">
            <p className="label-tag mb-4">— В цифрах</p>
            <h2 style={{ fontSize: "clamp(44px, 8vw, 96px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.88, color: "#fff" }}>
              Нам<br /><span style={{ color: "var(--accent)" }}>доверяют</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { label: "Товаров в каталоге", value: totalCount, suffix: "+" },
              { label: "Лет на рынке",       value: 12,         suffix: "" },
              { label: "Заказов в день",      value: 50,         suffix: "+" },
              { label: "Гарантия качества",   value: 100,        suffix: "%" },
            ].map(({ label, value, suffix }, i) => (
              <ScrollReveal key={label} delay={i * 80}>
                <div
                  style={{
                    padding: "48px 32px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    borderRight: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  }}
                >
                  <p style={{ fontSize: "clamp(44px, 6vw, 80px)", fontWeight: 900, letterSpacing: "-0.04em", color: "var(--accent)", lineHeight: 0.9, marginBottom: 12 }}>
                    <CountUp target={value} suffix={suffix} />
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-3)", letterSpacing: "0.04em" }}>
                    {label}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

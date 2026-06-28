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

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)" }}>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      {carouselProducts.length > 0 ? (
        <HeroCarousel products={carouselProducts} storeSlug={slug} storeName={store.name} />
      ) : (
        <div
          className="min-h-[60vh] flex items-center justify-center px-6"
          style={{ paddingTop: 52, background: "#000" }}
        >
          <div className="text-center">
            <p className="label-tag mb-4" style={{ color: "var(--accent-on-dark)" }}>Магазин пуст</p>
            <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.4)" }}>Добавьте товары в магазин</p>
          </div>
        </div>
      )}

      {/* ══ CATEGORIES ══════════════════════════════════════════ */}
      {store.categories.length > 0 && (
        <section style={{ background: "var(--bg)", padding: "96px 0" }}>
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

            <ScrollReveal>
              <div style={{ marginBottom: 48 }}>
                <p className="label-tag" style={{ marginBottom: 12 }}>Разделы</p>
                <h2
                  className="font-bold tracking-tight"
                  style={{ fontSize: "clamp(36px, 5vw, 64px)", letterSpacing: "-0.02em", color: "var(--text)" }}
                >
                  Что ищете?
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Карточка "Все товары" */}
              <ScrollReveal>
                <Link href={`${base}/catalog`} className="cat-card-dark">
                  <div>
                    <p
                      className="text-[11px] font-semibold tracking-[0.08em] uppercase"
                      style={{ color: "var(--accent-on-dark)", marginBottom: 8 }}
                    >
                      Весь каталог
                    </p>
                    <p className="text-[20px] font-semibold" style={{ color: "#fff" }}>
                      Все товары
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {totalCount}+ позиций
                    </span>
                    <ArrowUpRight className="h-5 w-5" style={{ color: "var(--accent-on-dark)" }} />
                  </div>
                </Link>
              </ScrollReveal>

              {store.categories.map((cat, i) => (
                <ScrollReveal key={cat.id} delay={i * 50}>
                  <Link href={`${base}/catalog?category=${cat.slug}`} className="cat-card">
                    <div>
                      <p className="text-[20px] font-semibold" style={{ color: "var(--text)" }}>
                        {cat.name}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px]" style={{ color: "var(--text-3)" }}>
                        {cat._count.products} товаров
                      </span>
                      <ArrowUpRight
                        className="cat-arrow h-4 w-4"
                        style={{ color: "var(--accent)" }}
                      />
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ BANNERS ═════════════════════════════════════════════ */}
      {heroBanners.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-8">
          <BannerCarousel banners={heroBanners as never} />
        </div>
      )}

      {/* ══ FEATURED — ХИТЫ ПРОДАЖ ══════════════════════════════ */}
      {featuredProducts.length > 0 && (
        <section style={{ background: "var(--bg)", padding: "80px 0 96px" }}>
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

            <ScrollReveal>
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="label-tag" style={{ marginBottom: 8 }}>Популярное</p>
                  <h2
                    className="font-bold"
                    style={{ fontSize: "clamp(36px, 5vw, 64px)", letterSpacing: "-0.02em", color: "var(--text)" }}
                  >
                    Хиты продаж
                  </h2>
                </div>
                <Link
                  href={`${base}/catalog?featured=1`}
                  className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold pb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Все <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </ScrollReveal>

            {/* Топ-товар */}
            {featuredProducts[0] && (
              <ScrollReveal className="mb-5">
                <Link
                  href={`${base}/product/${featuredProducts[0].slug}`}
                  className="featured-hero-card"
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative sm:w-72 lg:w-96 aspect-square sm:aspect-auto shrink-0 flex items-center justify-center p-10">
                      {featuredProducts[0].images[0] && (
                        <div className="relative w-full h-full" style={{ maxWidth: 260, maxHeight: 260 }}>
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
                    <div className="flex flex-col justify-between p-8 sm:p-10 lg:p-14">
                      <div>
                        <span className="label-tag block mb-4 opacity-50">01 · ХИТ</span>
                        <h3
                          className="font-bold leading-tight tracking-tight mb-4"
                          style={{ fontSize: "clamp(22px, 3vw, 42px)", letterSpacing: "-0.02em", color: "var(--text)" }}
                        >
                          {featuredProducts[0].name}
                        </h3>
                        <p
                          className="font-black"
                          style={{ fontSize: "clamp(26px, 3.5vw, 46px)", letterSpacing: "-0.02em", color: "var(--text)" }}
                        >
                          {formatPrice(featuredProducts[0].price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-8">
                        <span className="btn-primary" style={{ fontSize: 15, height: 48 }}>
                          Подробнее <ArrowUpRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            )}

            {/* Сетка карточек */}
            <div className="grid grid-cols-2 gap-4 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.slice(1).map((p, i) => (
                <ScrollReveal key={p.id} delay={i * 60}>
                  <ProductCard product={p} storeSlug={slug} index={i + 1} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ MINI BANNERS ════════════════════════════════════════ */}
      {miniBanners.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6">
          <MiniBanners banners={miniBanners as never} />
        </div>
      )}

      {/* ══ ПОЧЕМУ МЫ — тёмная секция ═══════════════════════════ */}
      <section style={{ background: "var(--bg-dark)", padding: "100px 0" }}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <ScrollReveal>
            <h2
              className="font-bold tracking-tight"
              style={{
                color: "#fff",
                fontSize: "clamp(32px, 5vw, 56px)",
                letterSpacing: "-0.02em",
                marginBottom: 64,
              }}
            >
              Почему выбирают нас
            </h2>
          </ScrollReveal>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 2,
              borderRadius: "var(--r-xl)",
              overflow: "hidden",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {[
              { icon: Truck,       title: "Быстрая доставка",    text: "Доставляем по городу в день заказа" },
              { icon: ShieldCheck, title: "Оригинальная техника", text: "Только официальные поставщики, без подделок" },
              { icon: Star,        title: "Гарантия 2 года",      text: "Полное сервисное обслуживание включено" },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <ScrollReveal key={i} delay={i * 80}>
                  <div
                    style={{
                      background: "var(--bg-dark)",
                      padding: "48px 40px",
                      borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none",
                    }}
                  >
                    <Icon className="h-8 w-8 mb-5" style={{ color: "var(--accent-on-dark)" }} strokeWidth={1.5} />
                    <div style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 10 }}>
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
        <section style={{ background: "var(--bg-gray)", padding: "96px 0" }}>
          <div className="max-w-[1400px] mx-auto">

            <ScrollReveal>
              <div className="px-6 lg:px-10 flex items-end justify-between mb-10">
                <div>
                  <p className="label-tag" style={{ marginBottom: 8 }}>Свежее</p>
                  <h2
                    className="font-bold tracking-tight"
                    style={{ fontSize: "clamp(36px, 5.5vw, 64px)", letterSpacing: "-0.02em", color: "var(--text)" }}
                  >
                    Новинки
                  </h2>
                </div>
                <Link
                  href={`${base}/catalog`}
                  className="hidden sm:flex items-center gap-1.5 text-[13px] font-semibold pb-2"
                  style={{ color: "var(--accent)" }}
                >
                  Каталог <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </ScrollReveal>

            <div
              className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-hide pb-4 px-6 lg:px-10 snap-x snap-mandatory"
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
      <section style={{ background: "var(--bg)", padding: "80px 0 100px" }}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <ScrollReveal>
            <div style={{ marginBottom: 48 }}>
              <p className="label-tag" style={{ marginBottom: 8 }}>Цифры</p>
              <h2
                className="font-bold tracking-tight"
                style={{ fontSize: "clamp(32px, 4.5vw, 56px)", letterSpacing: "-0.02em", color: "var(--text)" }}
              >
                Мы в цифрах
              </h2>
            </div>
          </ScrollReveal>

          <div
            className="grid grid-cols-2 sm:grid-cols-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {[
              { label: "Товаров в каталоге", value: totalCount, suffix: "+" },
              { label: "Лет на рынке",       value: 12,         suffix: "" },
              { label: "Заказов в день",      value: 50,         suffix: "+" },
              { label: "Гарантия качества",   value: 100,        suffix: "%" },
            ].map(({ label, value, suffix }, i) => (
              <ScrollReveal key={label} delay={i * 80}>
                <div
                  className="py-10 px-8"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    borderRight: i < 3 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <p
                    className="font-black leading-none tracking-tight mb-2"
                    style={{ fontSize: "clamp(40px, 5.5vw, 72px)", letterSpacing: "-0.03em", color: "var(--accent)" }}
                  >
                    <CountUp target={value} suffix={suffix} />
                  </p>
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-3)" }}>
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

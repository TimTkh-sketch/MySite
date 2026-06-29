import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/store/product-card"
import { FilterDrawer } from "@/components/store/filter-drawer"
import Link from "next/link"
import { ChevronRight, ArrowUpDown } from "lucide-react"

const SORT_OPTIONS = [
  { value: "", label: "По умолчанию" },
  { value: "new", label: "Новые" },
  { value: "price_asc", label: "Цена ↑" },
  { value: "price_desc", label: "Цена ↓" },
  { value: "popular", label: "Популярные" },
] as const

type SortValue = "" | "new" | "price_asc" | "price_desc" | "popular"

function buildOrderBy(sort: SortValue) {
  switch (sort) {
    case "price_asc":  return [{ price: "asc" as const }]
    case "price_desc": return [{ price: "desc" as const }]
    case "new":        return [{ createdAt: "desc" as const }]
    case "popular":    return [{ isFeatured: "desc" as const }, { createdAt: "desc" as const }]
    default:           return [{ sortOrder: "asc" as const }, { createdAt: "desc" as const }]
  }
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ category?: string; page?: string; featured?: string; sort?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? "1"))
  const pageSize = 24
  const sort = (sp.sort ?? "") as SortValue

  const store = await db.store.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true },
  })
  if (!store) notFound()

  const selectedCategory = sp.category
    ? await db.category.findFirst({ where: { storeId: store.id, slug: sp.category } })
    : null

  const rootCategories = await db.category.findMany({
    where: { storeId: store.id, isActive: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      _count: { select: { products: { where: { isActive: true } } } },
    },
  })

  const selectedRoot = selectedCategory
    ? rootCategories.find(
        (r) => r.id === selectedCategory.id || r.children.some((c) => c.id === selectedCategory.id)
      )
    : null

  const whereClause = {
    storeId: store.id,
    isActive: true,
    ...(selectedCategory ? { categoryId: selectedCategory.id } : {}),
    ...(sp.featured === "1" ? { isFeatured: true } : {}),
  }

  const [products, total] = await Promise.all([
    db.product.findMany({ where: whereClause, orderBy: buildOrderBy(sort), skip: (page - 1) * pageSize, take: pageSize }),
    db.product.count({ where: whereClause }),
  ])

  const emptyFallback = products.length === 0
    ? await db.product.findMany({
        where: { storeId: store.id, isActive: true },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take: 4,
      })
    : []

  const totalPages = Math.ceil(total / pageSize)
  const base = `/store/${slug}`
  const catalogBase = `${base}/catalog`

  const title = selectedCategory
    ? selectedCategory.name
    : sp.featured === "1"
    ? "Хиты продаж"
    : "Весь каталог"

  function buildPageHref(p: number) {
    const params = new URLSearchParams()
    if (sp.category) params.set("category", sp.category)
    if (sp.featured) params.set("featured", sp.featured)
    if (sort) params.set("sort", sort)
    params.set("page", String(p))
    return `${catalogBase}?${params.toString()}`
  }

  function buildSortHref(s: string) {
    const params = new URLSearchParams()
    if (sp.category) params.set("category", sp.category)
    if (sp.featured) params.set("featured", sp.featured)
    if (s) params.set("sort", s)
    const qs = params.toString()
    return qs ? `${catalogBase}?${qs}` : catalogBase
  }

  return (
    <div className="min-h-screen" style={{ background: "#000", paddingTop: 60 }}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-6 flex-wrap animate-fade-in" style={{ fontSize: 12 }}>
          <Link href={base} className="transition-colors" style={{ color: "var(--text-3)", textDecoration: "none" }}>Главная</Link>
          <ChevronRight className="h-3 w-3" style={{ color: "var(--text-3)" }} />
          {selectedRoot && selectedRoot.id !== selectedCategory?.id && (
            <>
              <Link href={`${catalogBase}?category=${selectedRoot.slug}`} className="transition-colors" style={{ color: "var(--text-3)", textDecoration: "none" }}>
                {selectedRoot.name}
              </Link>
              <ChevronRight className="h-3 w-3" style={{ color: "var(--text-3)" }} />
            </>
          )}
          <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{title}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10 animate-slide-up">
          <div>
            <p className="label-tag mb-3">— каталог</p>
            <h1 style={{ fontSize: "clamp(32px, 6vw, 72px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.88, color: "#fff" }}>
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Sort pills */}
            <div
              className="hidden sm:flex items-center gap-1 rounded-full px-2 py-1.5"
              style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <ArrowUpDown className="h-3.5 w-3.5 ml-1 mr-0.5" style={{ color: "var(--text-3)" }} />
              {SORT_OPTIONS.map(({ value, label }) => (
                <Link
                  key={value}
                  href={buildSortHref(value)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                  style={sort === value
                    ? { background: "var(--accent)", color: "#000" }
                    : { color: "var(--text-2)" }
                  }
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="sm:hidden">
              <FilterDrawer
                categories={rootCategories}
                storeSlug={slug}
                selectedSlug={selectedCategory?.slug}
                sortValue={sort}
              />
            </div>

            <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>{total} товаров</span>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">

          {/* Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0 animate-slide-up">
            <div
              className="rounded-2xl overflow-hidden sticky top-20"
              style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="label-tag" style={{ color: "var(--text-3)" }}>Категории</p>
              </div>
              <div className="py-1.5">
                <Link
                  href={catalogBase}
                  className="flex items-center justify-between px-4 py-2.5 text-sm transition-all"
                  style={
                    !selectedCategory && sp.featured !== "1"
                      ? { color: "var(--accent)", fontWeight: 700, background: "rgba(0,204,255,0.07)" }
                      : { color: "var(--text-2)", textDecoration: "none" }
                  }
                >
                  Все товары
                </Link>
                {rootCategories.map((cat) => (
                  <div key={cat.id}>
                    <Link
                      href={`${catalogBase}?category=${cat.slug}${sort ? `&sort=${sort}` : ""}`}
                      className="flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-all"
                      style={
                        selectedCategory?.id === cat.id
                          ? { color: "var(--accent)", fontWeight: 700, background: "rgba(0,204,255,0.07)", textDecoration: "none" }
                          : selectedRoot?.id === cat.id
                          ? { color: "#fff", textDecoration: "none" }
                          : { color: "var(--text-2)", textDecoration: "none" }
                      }
                    >
                      <span>{cat.name}</span>
                      {cat._count.products > 0 && (
                        <span style={{ fontSize: 11, color: "var(--text-3)" }}>{cat._count.products}</span>
                      )}
                    </Link>
                    {(selectedRoot?.id === cat.id || selectedCategory?.id === cat.id) && cat.children.length > 0 && (
                      <div className="ml-5 my-0.5" style={{ borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
                        {cat.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`${catalogBase}?category=${child.slug}${sort ? `&sort=${sort}` : ""}`}
                            className="flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                            style={
                              selectedCategory?.id === child.id
                                ? { color: "var(--accent)", fontWeight: 700, textDecoration: "none" }
                                : { color: "var(--text-2)", textDecoration: "none" }
                            }
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 opacity-50" style={{ background: "currentColor" }} />
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {products.length === 0 ? (
              <div className="space-y-8">
                <div className="rounded-2xl p-12 text-center" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", color: "#fff", marginBottom: 8 }}>
                    Товары не найдены
                  </p>
                  <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 24 }}>
                    Попробуй другую категорию или сбрось фильтры
                  </p>
                  <Link href={catalogBase} style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
                    Смотреть все товары →
                  </Link>
                </div>
                {emptyFallback.length > 0 && (
                  <div>
                    <p className="label-tag mb-4">— может понравиться</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                      {emptyFallback.map((p) => <ProductCard key={p.id} product={p} storeSlug={slug} />)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 animate-slide-up delay-100">
                {products.map((product) => <ProductCard key={product.id} product={product} storeSlug={slug} />)}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10 flex-wrap">
                {page > 1 && (
                  <Link href={buildPageHref(page - 1)} className="px-4 py-2 text-sm rounded-full transition-all" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-2)", textDecoration: "none" }}>
                    ← Назад
                  </Link>
                )}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i
                  return (
                    <Link key={p} href={buildPageHref(p)} className="w-10 h-10 flex items-center justify-center text-sm rounded-full transition-all" style={
                      p === page
                        ? { background: "var(--accent)", color: "#000", fontWeight: 700, textDecoration: "none" }
                        : { background: "#111", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-2)", textDecoration: "none" }
                    }>
                      {p}
                    </Link>
                  )
                })}
                {page < totalPages && (
                  <Link href={buildPageHref(page + 1)} className="px-4 py-2 text-sm rounded-full transition-all" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-2)", textDecoration: "none" }}>
                    Вперёд →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

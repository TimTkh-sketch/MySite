import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/store/product-card"
import { FilterDrawer } from "@/components/store/filter-drawer"
import Link from "next/link"
import { ChevronRight, ArrowUpDown } from "lucide-react"

const SORT_OPTIONS = [
  { value: "", label: "По умолчанию" },
  { value: "new", label: "Сначала новые" },
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
    db.product.findMany({
      where: whereClause,
      orderBy: buildOrderBy(sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-[#bbb] mb-5 animate-fade-in flex-wrap">
          <Link href={base} className="hover:text-[#666] transition-colors active:scale-95">Главная</Link>
          <ChevronRight className="h-3 w-3 text-[#d0d0d0]" />
          {selectedRoot && selectedRoot.id !== selectedCategory?.id && (
            <>
              <Link href={`${catalogBase}?category=${selectedRoot.slug}`} className="hover:text-[#666] transition-colors">
                {selectedRoot.name}
              </Link>
              <ChevronRight className="h-3 w-3 text-[#d0d0d0]" />
            </>
          )}
          <span className="text-[#666] font-semibold">{title}</span>
        </nav>

        {/* Header strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 animate-slide-up">
          <div>
            <p className="label-tag mb-1 text-[#999]">— КАТАЛОГ</p>
            <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight">{title}</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort pills — desktop */}
            <div className="hidden sm:flex items-center gap-1 bg-[#f5f5f5] border border-[#e8e8e8] rounded-full px-2 py-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-[#bbb] ml-1 mr-0.5" />
              {SORT_OPTIONS.map(({ value, label }) => (
                <Link
                  key={value}
                  href={buildSortHref(value)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${
                    sort === value
                      ? "bg-[#fff3ee] text-[#F26522] border border-[#F26522]/20"
                      : "text-[#666] hover:text-[#1a1a1a] hover:bg-[#f0f0f0]"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Filter drawer — mobile */}
            <div className="sm:hidden">
              <FilterDrawer
                categories={rootCategories}
                storeSlug={slug}
                selectedSlug={selectedCategory?.slug}
                sortValue={sort}
              />
            </div>

            <span className="text-sm text-[#999] font-medium">{total} товаров</span>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row">

          {/* Sidebar — desktop */}
          <aside className="hidden lg:block w-60 shrink-0 animate-slide-up">
            <div className="glass rounded-2xl overflow-hidden sticky top-24">
              <div className="px-4 py-3 border-b border-[#e8e8e8]">
                <p className="label-tag text-[#999]">КАТЕГОРИИ</p>
              </div>
              <div className="py-1.5">
                <Link
                  href={catalogBase}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm transition-all duration-150 ${
                    !selectedCategory && sp.featured !== "1"
                      ? "text-[#F26522] font-black bg-[#fff3ee]"
                      : "text-[#666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
                  }`}
                >
                  Все товары
                </Link>
                {rootCategories.map((cat) => (
                  <div key={cat.id}>
                    <Link
                      href={`${catalogBase}?category=${cat.slug}${sort ? `&sort=${sort}` : ""}`}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                        selectedCategory?.id === cat.id
                          ? "text-[#F26522] font-black bg-[#fff3ee]"
                          : selectedRoot?.id === cat.id
                          ? "text-[#1a1a1a]"
                          : "text-[#666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
                      }`}
                    >
                      <span>{cat.name}</span>
                      {cat._count.products > 0 && (
                        <span className="text-xs text-[#bbb]">{cat._count.products}</span>
                      )}
                    </Link>
                    {(selectedRoot?.id === cat.id || selectedCategory?.id === cat.id) &&
                      cat.children.length > 0 && (
                        <div className="border-l-2 border-[#e8e8e8] ml-5 my-0.5">
                          {cat.children.map((child) => (
                            <Link
                              key={child.id}
                              href={`${catalogBase}?category=${child.slug}${sort ? `&sort=${sort}` : ""}`}
                              className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                                selectedCategory?.id === child.id
                                  ? "text-[#F26522] font-bold"
                                  : "text-[#666] hover:text-[#1a1a1a] hover:bg-[#f5f5f5]"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-60" />
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
                <div className="glass rounded-2xl p-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#f5f5f5] border border-[#e8e8e8] flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <p className="font-black text-[#1a1a1a] mb-1">Товары не найдены</p>
                  <p className="text-sm text-[#999] mb-4">Попробуй другую категорию или сбрось фильтры</p>
                  <Link
                    href={catalogBase}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#666] hover:text-[#F26522] transition-colors active:scale-95"
                  >
                    Смотреть все товары →
                  </Link>
                </div>

                {emptyFallback.length > 0 && (
                  <div>
                    <p className="label-tag mb-4 text-[#999]">— МОЖЕТ ПОНРАВИТЬСЯ</p>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                      {emptyFallback.map((p) => (
                        <ProductCard key={p.id} product={p} storeSlug={slug} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 animate-slide-up delay-100">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} storeSlug={slug} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 mt-8 flex-wrap">
                {page > 1 && (
                  <Link href={buildPageHref(page - 1)} className="px-4 py-2 text-sm rounded-xl bg-[#f5f5f5] border border-[#e8e8e8] text-[#666] hover:bg-[#ffe8d8] hover:text-[#F26522] hover:scale-105 active:scale-95 transition-all duration-150">
                    ← Назад
                  </Link>
                )}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i
                  return (
                    <Link
                      key={p}
                      href={buildPageHref(p)}
                      className={`w-10 h-10 flex items-center justify-center text-sm rounded-xl border transition-all duration-150 hover:scale-105 active:scale-95 ${
                        p === page
                          ? "bg-[#F26522] text-white border-[#F26522] font-black shadow-md"
                          : "border-[#e8e8e8] bg-transparent text-[#666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
                      }`}
                    >
                      {p}
                    </Link>
                  )
                })}
                {page < totalPages && (
                  <Link href={buildPageHref(page + 1)} className="px-4 py-2 text-sm rounded-xl bg-[#f5f5f5] border border-[#e8e8e8] text-[#666] hover:bg-[#ffe8d8] hover:text-[#F26522] hover:scale-105 active:scale-95 transition-all duration-150">
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

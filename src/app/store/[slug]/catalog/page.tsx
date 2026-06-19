import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/store/product-card"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ category?: string; page?: string; featured?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? "1"))
  const pageSize = 24

  const store = await db.store.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true },
  })
  if (!store) notFound()

  const selectedCategory = sp.category
    ? await db.category.findFirst({ where: { storeId: store.id, slug: sp.category } })
    : null

  // Get root categories with children for sidebar
  const rootCategories = await db.category.findMany({
    where: { storeId: store.id, isActive: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      _count: { select: { products: { where: { isActive: true } } } },
    },
  })

  // Find which root category the selected category belongs to
  const selectedRoot = selectedCategory
    ? rootCategories.find(
        (r) =>
          r.id === selectedCategory.id ||
          r.children.some((c) => c.id === selectedCategory.id)
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
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where: whereClause }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const base = `/store/${slug}`

  const title = selectedCategory
    ? selectedCategory.name
    : sp.featured === "1"
    ? "Хиты продаж"
    : "Весь каталог"

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-5">
          <Link href={base} className="hover:text-[#FF6B35] transition-colors">Главная</Link>
          <ChevronRight className="h-3 w-3" />
          {selectedRoot && selectedRoot.id !== selectedCategory?.id && (
            <>
              <Link href={`${base}/catalog?category=${selectedRoot.slug}`} className="hover:text-[#FF6B35] transition-colors">
                {selectedRoot.name}
              </Link>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <span className="text-gray-900 font-medium">{title}</span>
        </nav>

        <div className="flex flex-col gap-5 lg:flex-row">

          {/* Sidebar */}
          <aside className="w-full lg:w-60 shrink-0">
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-900">Категории</p>
              </div>
              <div className="py-1.5">
                <Link
                  href={`${base}/catalog`}
                  className={`flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                    !selectedCategory && sp.featured !== "1"
                      ? "text-[#FF6B35] font-semibold bg-orange-50"
                      : "text-gray-700 hover:bg-gray-50 hover:text-[#FF6B35]"
                  }`}
                >
                  Все товары
                </Link>
                {rootCategories.map((cat) => (
                  <div key={cat.id}>
                    <Link
                      href={`${base}/catalog?category=${cat.slug}`}
                      className={`flex items-center justify-between px-4 py-2 text-sm font-medium transition-colors ${
                        selectedCategory?.id === cat.id
                          ? "text-[#FF6B35] bg-orange-50"
                          : selectedRoot?.id === cat.id
                          ? "text-[#FF6B35]"
                          : "text-gray-800 hover:bg-gray-50 hover:text-[#FF6B35]"
                      }`}
                    >
                      <span>{cat.name}</span>
                      {cat._count.products > 0 && (
                        <span className="text-xs text-gray-400">{cat._count.products}</span>
                      )}
                    </Link>
                    {/* Show subcategories if this root is selected */}
                    {(selectedRoot?.id === cat.id || selectedCategory?.id === cat.id) &&
                      cat.children.length > 0 && (
                        <div className="border-l-2 border-[#FF6B35] ml-5 my-0.5">
                          {cat.children.map((child) => (
                            <Link
                              key={child.id}
                              href={`${base}/catalog?category=${child.slug}`}
                              className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                                selectedCategory?.id === child.id
                                  ? "text-[#FF6B35] font-medium"
                                  : "text-gray-600 hover:text-[#FF6B35]"
                              }`}
                            >
                              <span className="w-1 h-1 rounded-full bg-current shrink-0 opacity-60" />
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

          {/* Products grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              <span className="text-sm text-gray-400">{total} товаров</span>
            </div>

            {products.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center">
                <p className="text-3xl mb-3">🔍</p>
                <p className="text-gray-500 font-medium">Товары не найдены</p>
                <Link href={`${base}/catalog`} className="mt-4 inline-block text-sm text-[#FF6B35] hover:underline">
                  Смотреть все товары
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} storeSlug={slug} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 mt-8">
                {page > 1 && (
                  <Link
                    href={`${base}/catalog?page=${page - 1}${selectedCategory ? `&category=${selectedCategory.slug}` : ""}`}
                    className="px-4 py-2 text-sm rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                  >
                    ← Назад
                  </Link>
                )}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i
                  return (
                    <Link
                      key={p}
                      href={`${base}/catalog?page=${p}${selectedCategory ? `&category=${selectedCategory.slug}` : ""}`}
                      className={`w-10 h-10 flex items-center justify-center text-sm rounded-xl border transition-colors ${
                        p === page
                          ? "bg-[#FF6B35] text-white border-[#FF6B35] font-semibold"
                          : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {p}
                    </Link>
                  )
                })}
                {page < totalPages && (
                  <Link
                    href={`${base}/catalog?page=${page + 1}${selectedCategory ? `&category=${selectedCategory.slug}` : ""}`}
                    className="px-4 py-2 text-sm rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                  >
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

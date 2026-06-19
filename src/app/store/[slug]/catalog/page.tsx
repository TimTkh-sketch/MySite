import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/store/product-card"
import Link from "next/link"

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ category?: string; page?: string; featured?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const page = parseInt(sp.page ?? "1")
  const pageSize = 24

  const store = await db.store.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true },
  })
  if (!store) notFound()

  const selectedCategory = sp.category
    ? await db.category.findFirst({ where: { storeId: store.id, slug: sp.category } })
    : null

  const categories = await db.category.findMany({
    where: { storeId: store.id, isActive: true },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  })

  const [products, total] = await Promise.all([
    db.product.findMany({
      where: {
        storeId: store.id,
        isActive: true,
        ...(selectedCategory ? { categoryId: selectedCategory.id } : {}),
        ...(sp.featured === "1" ? { isFeatured: true } : {}),
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({
      where: {
        storeId: store.id,
        isActive: true,
        ...(selectedCategory ? { categoryId: selectedCategory.id } : {}),
        ...(sp.featured === "1" ? { isFeatured: true } : {}),
      },
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const base = `/store/${slug}`

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full lg:w-56 shrink-0">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="font-semibold text-gray-900 mb-3">Категории</p>
            <div className="space-y-0.5">
              <Link
                href={`${base}/catalog`}
                className={`block rounded-md px-3 py-2 text-sm ${!selectedCategory ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"}`}
              >
                Все товары ({total})
              </Link>
              {categories
                .filter((c) => !c.parentId)
                .map((cat) => (
                  <Link
                    key={cat.id}
                    href={`${base}/catalog?category=${cat.slug}`}
                    className={`block rounded-md px-3 py-2 text-sm ${selectedCategory?.id === cat.id ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {cat.name}
                  </Link>
                ))}
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedCategory ? selectedCategory.name : sp.featured === "1" ? "Хиты продаж" : "Каталог"}
            </h1>
            <span className="text-sm text-gray-500">{total} товаров</span>
          </div>

          {products.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
              <p className="text-gray-400">Товары не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} storeSlug={slug} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`${base}/catalog?page=${p}${selectedCategory ? `&category=${selectedCategory.slug}` : ""}`}
                  className={`px-3 py-1.5 text-sm rounded-md border ${p === page ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 hover:bg-gray-50"}`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

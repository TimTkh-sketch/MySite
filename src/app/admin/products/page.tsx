import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Search } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { DeleteProductButton } from "@/components/admin/delete-product-button"
import { CategoryTree } from "@/components/admin/category-tree"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; page?: string; category?: string; q?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1"))
  const pageSize = 20
  const storeId = params.store
  const categoryId = params.category
  const query = params.q?.trim()

  // Get default store
  const stores = await db.store.findMany({ select: { id: true, name: true }, take: 5 })
  const activeStoreId = storeId ?? stores[0]?.id

  // Category tree for sidebar
  const rootCategories = await db.category.findMany({
    where: { storeId: activeStoreId, parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: true } },
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { products: true } },
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            include: { _count: { select: { products: true } } },
          },
        },
      },
    },
  })

  const whereClause = {
    storeId: activeStoreId,
    ...(categoryId ? { categoryId } : {}),
    ...(query ? { name: { contains: query, mode: "insensitive" as const } } : {}),
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where: whereClause,
      include: {
        category: { select: { name: true } },
        store: { select: { name: true } },
        variants: { select: { id: true, price: true, name: true }, take: 20 },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where: whereClause }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const selectedCategory = categoryId
    ? await db.category.findUnique({ where: { id: categoryId }, select: { name: true } })
    : null

  const baseUrl = "/admin/products"
  const filterUrl = `${baseUrl}${activeStoreId !== stores[0]?.id ? `?store=${activeStoreId}` : ""}`

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Товары</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} товаров{selectedCategory ? ` в «${selectedCategory.name}»` : ""}</p>
        </div>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            Добавить товар
          </Button>
        </Link>
      </div>

      {/* Store tabs */}
      {stores.length > 1 && (
        <div className="flex gap-2">
          {stores.map((s) => (
            <Link key={s.id} href={`${baseUrl}?store=${s.id}`}>
              <Button size="sm" variant={activeStoreId === s.id ? "default" : "outline"}>
                {s.name}
              </Button>
            </Link>
          ))}
        </div>
      )}

      {/* Main: sidebar + table */}
      <div className="flex gap-4 items-start">

        {/* Category tree sidebar */}
        <CategoryTree
          categories={rootCategories as never}
          selectedId={categoryId}
          baseUrl={filterUrl || baseUrl}
        />

        {/* Products table */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Search bar */}
          <form method="get" action={baseUrl} className="relative">
            {categoryId && <input type="hidden" name="category" value={categoryId} />}
            {activeStoreId && activeStoreId !== stores[0]?.id && <input type="hidden" name="store" value={activeStoreId} />}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Поиск товаров..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
            />
          </form>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {products.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-gray-400 mb-3">Товаров не найдено</p>
                <Link href="/admin/products/new">
                  <Button size="sm"><Plus className="h-4 w-4" />Добавить товар</Button>
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-3">Товар</th>
                    <th className="px-4 py-3 hidden md:table-cell">Цена</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Остаток</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Статус</th>
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((product) => {
                    const variantCount = product.variants.length
                    const variantPrices = product.variants.map((v) => v.price ?? product.price)
                    const minPrice = variantPrices.length ? Math.min(...variantPrices) : product.price
                    const maxPrice = variantPrices.length ? Math.max(...variantPrices) : product.price
                    const hasRange = maxPrice > minPrice

                    return (
                      <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                              {product.images[0] ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  width={44}
                                  height={44}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">—</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link href={`/admin/products/${product.id}`} className="font-medium text-gray-900 hover:text-orange-600 transition-colors line-clamp-1">
                                {product.name}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5">
                                {product.category && (
                                  <span className="text-xs text-gray-400 truncate">{product.category.name}</span>
                                )}
                                {variantCount > 0 && (
                                  <span className="text-xs text-blue-500 shrink-0">
                                    · {variantCount} {variantCount === 1 ? "вариант" : variantCount < 5 ? "варианта" : "вариантов"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="font-medium text-gray-900 whitespace-nowrap">
                            {hasRange
                              ? `${formatPrice(minPrice)} — ${formatPrice(maxPrice)}`
                              : formatPrice(product.price)}
                          </span>
                          {product.comparePrice && !hasRange && (
                            <p className="text-xs text-gray-400 line-through">{formatPrice(product.comparePrice)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={`text-sm font-medium ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                            {product.stock > 0 ? `${product.stock} шт.` : "Нет"}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            product.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                            {product.isActive ? "Активен" : "Скрыт"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Link href={`/admin/products/${product.id}`}>
                              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </Link>
                            <DeleteProductButton id={product.id} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} из {total}</span>
              <div className="flex items-center gap-1">
                {page > 1 && (
                  <Link href={`${baseUrl}?page=${page - 1}${categoryId ? `&category=${categoryId}` : ""}${query ? `&q=${query}` : ""}`}>
                    <Button size="sm" variant="outline">←</Button>
                  </Link>
                )}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i
                  return (
                    <Link key={p} href={`${baseUrl}?page=${p}${categoryId ? `&category=${categoryId}` : ""}${query ? `&q=${query}` : ""}`}>
                      <Button size="sm" variant={p === page ? "default" : "outline"}>{p}</Button>
                    </Link>
                  )
                })}
                {page < totalPages && (
                  <Link href={`${baseUrl}?page=${page + 1}${categoryId ? `&category=${categoryId}` : ""}${query ? `&q=${query}` : ""}`}>
                    <Button size="sm" variant="outline">→</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

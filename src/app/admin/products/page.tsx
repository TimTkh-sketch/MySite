import Link from "next/link"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { CategoryTree } from "@/components/admin/category-tree"
import { ProductsTable } from "@/components/admin/products-table"

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

  // Flat categories list for "move to category" action
  const allCategories = await db.category.findMany({
    where: { storeId: activeStoreId, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, parentId: true },
  })

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
        variants: { select: { id: true, price: true, name: true, stock: true, sku: true }, take: 50 },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
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
          key={categoryId ?? "all"}
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
          <ProductsTable products={products as never} storeId={activeStoreId ?? ""} allCategories={allCategories} />

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

import Link from "next/link"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, ChevronRight } from "lucide-react"
import { DeleteCategoryButton } from "@/components/admin/delete-category-button"

export default async function CategoriesPage() {
  const allCats = await db.category.findMany({
    include: {
      store: { select: { name: true } },
      _count: { select: { products: true, children: true } },
    },
    orderBy: [{ storeId: "asc" }, { parentId: "asc" }, { sortOrder: "asc" }],
  })

  // Build tree per store
  const stores = [...new Set(allCats.map((c) => c.store.name))]
  const roots = allCats.filter((c) => !c.parentId)
  const childrenOf = (parentId: string) => allCats.filter((c) => c.parentId === parentId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
          <p className="text-sm text-gray-500 mt-1">{allCats.length} категорий</p>
        </div>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="h-4 w-4" />
            Добавить
          </Button>
        </Link>
      </div>

      {stores.map((storeName) => {
        const storeRoots = roots.filter((c) => c.store.name === storeName)
        return (
          <div key={storeName} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">{storeName}</span>
              <span className="text-xs text-gray-400">{allCats.filter(c => c.store.name === storeName).length} категорий</span>
            </div>

            <div className="divide-y divide-gray-50">
              {storeRoots.map((root) => {
                const children = childrenOf(root.id)
                return (
                  <div key={root.id}>
                    {/* Root category row */}
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {children.length > 0 ? (
                          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                        ) : (
                          <span className="w-4 shrink-0" />
                        )}
                        <span className="font-semibold text-gray-900 text-sm truncate">{root.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {root._count.products > 0 && `${root._count.products} тов.`}
                          {children.length > 0 && ` · ${children.length} подкат.`}
                        </span>
                        {!root.isActive && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">скрыта</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Link href={`/admin/categories/${root.id}`}>
                          <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        <DeleteCategoryButton id={root.id} />
                      </div>
                    </div>

                    {/* Children */}
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 group border-t border-gray-50"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0 pl-6">
                          <span className="w-px h-4 bg-gray-200 shrink-0" />
                          <span className="w-3 h-px bg-gray-200 shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{child.name}</span>
                          {child._count.products > 0 && (
                            <span className="text-xs text-gray-400 shrink-0">{child._count.products} тов.</span>
                          )}
                          {!child.isActive && (
                            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full shrink-0">скрыта</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Link href={`/admin/categories/${child.id}`}>
                            <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <DeleteCategoryButton id={child.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {allCats.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-16 text-center">
          <p className="text-gray-400">Категорий пока нет</p>
          <Link href="/admin/categories/new" className="mt-4 inline-block">
            <Button><Plus className="h-4 w-4" />Добавить первую</Button>
          </Link>
        </div>
      )}
    </div>
  )
}

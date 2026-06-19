import Link from "next/link"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { DeleteCategoryButton } from "@/components/admin/delete-category-button"

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    include: {
      store: { select: { name: true } },
      _count: { select: { products: true } },
    },
    orderBy: [{ storeId: "asc" }, { sortOrder: "asc" }],
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="h-4 w-4" />
            Добавить категорию
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">Категорий пока нет</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Название</th>
                <th className="px-5 py-3">Магазин</th>
                <th className="px-5 py-3">Товаров</th>
                <th className="px-5 py-3">Статус</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{cat.store.name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{cat._count.products}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={cat.isActive ? "success" : "outline"}>
                      {cat.isActive ? "Активна" : "Скрыта"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/categories/${cat.id}`}>
                        <Button size="sm" variant="outline">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <DeleteCategoryButton id={cat.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

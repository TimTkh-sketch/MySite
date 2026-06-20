import Link from "next/link"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CategoriesManager } from "@/components/admin/categories-manager"

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    include: { _count: { select: { products: true, children: true } } },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
  })

  const total = categories.length
  const hidden = categories.filter((c) => !c.isActive).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} категорий{hidden > 0 && ` · ${hidden} скрыто`}
          </p>
        </div>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="h-4 w-4" />
            Добавить
          </Button>
        </Link>
      </div>

      <p className="text-xs text-gray-400 px-1">
        Перетащите строку за ⠿ чтобы изменить порядок · Глазок — скрыть/показать категорию
      </p>

      <CategoriesManager categories={categories} />
    </div>
  )
}

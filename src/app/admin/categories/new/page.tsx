import { db } from "@/lib/db"
import { CategoryForm } from "@/components/admin/category-form"

export default async function NewCategoryPage() {
  const stores = await db.store.findMany({ select: { id: true, name: true } })
  const categories = await db.category.findMany({ select: { id: true, name: true, storeId: true } })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Новая категория</h1>
      <CategoryForm stores={stores} categories={categories} />
    </div>
  )
}

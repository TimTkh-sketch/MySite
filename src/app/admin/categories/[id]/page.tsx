import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { CategoryForm } from "@/components/admin/category-form"

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [category, stores, categories] = await Promise.all([
    db.category.findUnique({ where: { id } }),
    db.store.findMany({ select: { id: true, name: true } }),
    db.category.findMany({ select: { id: true, name: true, storeId: true } }),
  ])

  if (!category) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Редактировать категорию</h1>
      <CategoryForm category={category} stores={stores} categories={categories.filter(c => c.id !== id)} />
    </div>
  )
}

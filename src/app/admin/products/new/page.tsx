import { db } from "@/lib/db"
import { ProductForm } from "@/components/admin/product-form"

export default async function NewProductPage() {
  const stores = await db.store.findMany({ select: { id: true, name: true } })
  const categories = await db.category.findMany({
    select: { id: true, name: true, storeId: true },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Новый товар</h1>
      <ProductForm stores={stores} categories={categories} />
    </div>
  )
}

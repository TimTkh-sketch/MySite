import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ProductForm } from "@/components/admin/product-form"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [product, stores, categories] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.store.findMany({ select: { id: true, name: true } }),
    db.category.findMany({ select: { id: true, name: true, storeId: true } }),
  ])

  if (!product) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Редактировать товар</h1>
      <ProductForm product={product} stores={stores} categories={categories} />
    </div>
  )
}

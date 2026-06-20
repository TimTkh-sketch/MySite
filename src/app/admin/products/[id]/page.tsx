import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ProductForm } from "@/components/admin/product-form"
import { VariantManager } from "@/components/admin/variant-manager"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [product, stores, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { price: "asc" } },
        colorImages: true,
      },
    }),
    db.store.findMany({ select: { id: true, name: true } }),
    db.category.findMany({ select: { id: true, name: true, storeId: true } }),
  ])

  if (!product) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Редактировать товар</h1>
      <ProductForm product={product} stores={stores} categories={categories} />
      <VariantManager
        variants={product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          value: v.value,
          price: v.price,
          stock: v.stock,
          sku: v.sku,
          image: (v as unknown as { image: string | null }).image ?? null,
        }))}
        productId={product.id}
        productImages={product.images}
        basePrice={product.price}
        initialColorImages={Object.fromEntries(
          product.colorImages.map((ci) => [ci.colorValue, ci.images])
        )}
      />
    </div>
  )
}

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { HomepageEditor } from "./homepage-editor"

export default async function HomepagePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const store = await db.store.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  })

  if (!store) {
    return (
      <div className="text-gray-500 text-sm">
        Нет активного магазина.{" "}
        <a href="/admin/stores/new" className="text-blue-600 underline">
          Создать магазин
        </a>
      </div>
    )
  }

  const [allProducts, featuredProducts, newProducts] = await Promise.all([
    db.product.findMany({
      where: { storeId: store.id, isActive: true },
      orderBy: [{ isFeatured: "desc" }, { price: "desc" }],
      select: { id: true, name: true, price: true, images: true, isFeatured: true, createdAt: true },
      take: 100,
    }),
    db.product.findMany({
      where: { storeId: store.id, isActive: true, isFeatured: true },
      orderBy: { price: "desc" },
      select: { id: true, name: true, price: true, images: true, isFeatured: true, createdAt: true },
    }),
    db.product.findMany({
      where: { storeId: store.id, isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, price: true, images: true, isFeatured: true, createdAt: true },
      take: 10,
    }),
  ])

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Редактор главной страницы</h1>
        <p className="text-sm text-gray-500 mt-1">
          Управляйте товарами в карусели, хитами продаж и новинками.
        </p>
      </div>
      <HomepageEditor
        products={allProducts}
        featuredProducts={featuredProducts}
        newProducts={newProducts}
        storeSlug={store.slug}
      />
    </div>
  )
}

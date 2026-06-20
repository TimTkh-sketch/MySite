import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/store/product-card"
import { ProductView } from "@/components/store/product-view"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>
}) {
  const { slug, productSlug } = await params

  const store = await db.store.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true, settings: { select: { phone: true } } },
  })
  if (!store) notFound()

  const product = await db.product.findFirst({
    where: { storeId: store.id, slug: productSlug, isActive: true },
    include: {
      category: { include: { parent: true } },
      variants: { orderBy: { price: "asc" } },
      colorImages: true,
    },
  })
  if (!product) notFound()

  const related = await db.product.findMany({
    where: {
      storeId: store.id,
      isActive: true,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    orderBy: { isFeatured: "desc" },
    take: 4,
  })

  const base = `/store/${slug}`

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-gray-500 mb-6 flex-wrap">
          <Link href={base} className="hover:text-[#FF6B35] transition-colors">Главная</Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <Link href={`${base}/catalog`} className="hover:text-[#FF6B35] transition-colors">Каталог</Link>
          {product.category?.parent && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <Link href={`${base}/catalog?category=${product.category.parent.slug}`} className="hover:text-[#FF6B35] transition-colors">
                {product.category.parent.name}
              </Link>
            </>
          )}
          {product.category && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <Link href={`${base}/catalog?category=${product.category.slug}`} className="hover:text-[#FF6B35] transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main product block */}
        <div className="mb-10">
          <ProductView
            product={{
              id: product.id,
              name: product.name,
              price: product.price,
              comparePrice: product.comparePrice,
              images: product.images,
              slug: product.slug,
              stock: product.stock,
              sku: product.sku,
            }}
            variants={product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              value: v.value,
              price: v.price,
              stock: v.stock,
              image: (v as unknown as { image: string | null }).image ?? null,
            }))}
            colorImages={Object.fromEntries(
              product.colorImages.map((ci) => [ci.colorValue, ci.images])
            )}
            phone={store.settings?.phone}
          />
        </div>

        {/* Description section — full HTML from InSales */}
        {product.description && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Описание и характеристики</h2>
            </div>
            <div
              className="p-6 product-description"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        {/* Related products */}
        {related.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-5">Похожие товары</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} storeSlug={slug} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

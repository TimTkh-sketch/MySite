import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { db } from "@/lib/db"
import { formatPrice, getDiscount } from "@/lib/utils"
import { AddToCartButton } from "@/components/store/add-to-cart-button"
import { ProductCard } from "@/components/store/product-card"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>
}) {
  const { slug, productSlug } = await params

  const store = await db.store.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true },
  })
  if (!store) notFound()

  const product = await db.product.findFirst({
    where: { storeId: store.id, slug: productSlug, isActive: true },
    include: { category: true },
  })
  if (!product) notFound()

  const related = await db.product.findMany({
    where: {
      storeId: store.id,
      isActive: true,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 4,
  })

  const discount = getDiscount(product.price, product.comparePrice)
  const base = `/store/${slug}`

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href={base} className="hover:text-gray-900">Главная</Link>
        <span>/</span>
        <Link href={`${base}/catalog`} className="hover:text-gray-900">Каталог</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`${base}/catalog?category=${product.category.slug}`} className="hover:text-gray-900">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 mb-3">
            {product.images[0] ? (
              <Image src={product.images[0]} alt={product.name} fill className="object-cover" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-300">Нет фото</div>
            )}
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                -{discount}%
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1).map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image src={img} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {product.sku && <p className="text-sm text-gray-400">Артикул: {product.sku}</p>}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{product.name}</h1>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xl text-gray-400 line-through">{formatPrice(product.comparePrice)}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {product.stock > 0 ? (
              <span className="text-sm font-medium text-green-600">✓ В наличии ({product.stock} шт.)</span>
            ) : (
              <span className="text-sm font-medium text-red-500">Нет в наличии</span>
            )}
          </div>

          <AddToCartButton product={product} />

          {product.description && (
            <div className="border-t border-gray-200 pt-5">
              <h2 className="font-semibold text-gray-900 mb-3">Описание</h2>
              <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line">
                {product.description}
              </div>
            </div>
          )}

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Похожие товары</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} storeSlug={slug} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

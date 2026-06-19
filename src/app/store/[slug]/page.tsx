import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/store/product-card"
import { formatPrice } from "@/lib/utils"

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const store = await db.store.findUnique({
    where: { slug, isActive: true },
    include: {
      banners: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 3 },
      categories: {
        where: { isActive: true, parentId: null },
        orderBy: { sortOrder: "asc" },
        take: 8,
      },
    },
  })

  if (!store) notFound()

  const featuredProducts = await db.product.findMany({
    where: { storeId: store.id, isActive: true, isFeatured: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  })

  const newProducts = await db.product.findMany({
    where: { storeId: store.id, isActive: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  })

  const base = `/store/${slug}`

  return (
    <div>
      {store.banners.length > 0 && (
        <section className="relative h-72 sm:h-96 overflow-hidden bg-gray-900">
          <Image
            src={store.banners[0].image}
            alt={store.banners[0].title}
            fill
            className="object-cover opacity-70"
            priority
          />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-6 w-full">
              <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3">
                {store.banners[0].title}
              </h1>
              {store.banners[0].subtitle && (
                <p className="text-lg text-gray-200 mb-6">{store.banners[0].subtitle}</p>
              )}
              {store.banners[0].link && (
                <Link
                  href={store.banners[0].link}
                  className="inline-block bg-[#FF6B35] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#e55a25] transition-colors"
                >
                  Перейти
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-14">
        {store.categories.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Категории</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {store.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`${base}/catalog?category=${cat.slug}`}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 hover:bg-orange-50 hover:border-[#FF6B35] border border-transparent transition-colors text-center"
                >
                  <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {cat.image ? (
                      <Image src={cat.image} alt={cat.name} width={56} height={56} className="object-cover h-full w-full" />
                    ) : (
                      <span className="text-gray-500 text-xs">{cat.name[0]}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700 leading-tight">{cat.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {featuredProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Хиты продаж</h2>
              <Link href={`${base}/catalog?featured=1`} className="text-sm text-gray-500 hover:text-gray-900">
                Все →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} storeSlug={slug} />
              ))}
            </div>
          </section>
        )}

        {newProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Новинки</h2>
              <Link href={`${base}/catalog`} className="text-sm text-gray-500 hover:text-gray-900">
                Весь каталог →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} storeSlug={slug} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

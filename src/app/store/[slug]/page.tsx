import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/store/product-card"
import { BannerCarousel } from "@/components/store/banner-carousel"
import { MiniBanners } from "@/components/store/mini-banners"
import { formatPrice } from "@/lib/utils"

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const store = await db.store.findUnique({
    where: { slug, isActive: true },
    include: {
      banners: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, type: true, title: true, subtitle: true, image: true, link: true, buttonText: true } },
      categories: {
        where: { isActive: true, parentId: null },
        orderBy: { sortOrder: "asc" },
        take: 12,
        include: {
          _count: { select: { products: { where: { isActive: true } } } },
        },
      },
    },
  })

  if (!store) notFound()

  const featuredProducts = await db.product.findMany({
    where: { storeId: store.id, isActive: true, isFeatured: true },
    orderBy: { price: "desc" },
    take: 8,
  })

  const newProducts = await db.product.findMany({
    where: { storeId: store.id, isActive: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  })

  const heroBanners = store.banners.filter((b) => (b as { type: string }).type !== "mini")
  const miniBanners = store.banners.filter((b) => (b as { type: string }).type === "mini")

  const base = `/store/${slug}`

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero banner carousel */}
      {heroBanners.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <BannerCarousel banners={heroBanners as never} />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">

        {/* Categories */}
        {store.categories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">Категории</h2>
              <Link
                href={`${base}/catalog`}
                className="flex items-center gap-1 text-sm text-[#FF6B35] font-medium hover:underline"
              >
                Все <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12">
              {store.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`${base}/catalog?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-gray-100 hover:border-[#FF6B35] hover:shadow-md transition-all duration-200 text-center"
                >
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                    {(cat as { image?: string | null }).image ? (
                      <Image
                        src={(cat as { image: string }).image}
                        alt={cat.name}
                        width={56}
                        height={56}
                        className="object-cover h-full w-full group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <span className="text-xl font-bold text-gray-300">{cat.name[0]}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700 group-hover:text-[#FF6B35] leading-tight transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Mini banners */}
        {miniBanners.length > 0 && (
          <MiniBanners banners={miniBanners as never} />
        )}

        {/* Featured products */}
        {featuredProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Хиты продаж</h2>
                <p className="text-sm text-gray-500 mt-0.5">Самые популярные товары</p>
              </div>
              <Link
                href={`${base}/catalog?featured=1`}
                className="flex items-center gap-1 text-sm text-[#FF6B35] font-medium hover:underline shrink-0"
              >
                Все <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} storeSlug={slug} />
              ))}
            </div>
          </section>
        )}

        {/* New arrivals */}
        {newProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Новинки</h2>
                <p className="text-sm text-gray-500 mt-0.5">Только что добавленные товары</p>
              </div>
              <Link
                href={`${base}/catalog`}
                className="flex items-center gap-1 text-sm text-[#FF6B35] font-medium hover:underline shrink-0"
              >
                Весь каталог <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} storeSlug={slug} />
              ))}
            </div>
          </section>
        )}

        {/* Benefits strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { emoji: "🚚", title: "Доставка по Перми", text: "Быстро и удобно" },
            { emoji: "✅", title: "Оригинальная техника", text: "Гарантия производителя" },
            { emoji: "🔧", title: "Сервисный центр", text: "Ремонт и обслуживание" },
            { emoji: "💬", title: "Консультация", text: "+7 (342) 215-43-44" },
          ].map((b) => (
            <div key={b.title} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3">
              <span className="text-2xl shrink-0">{b.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{b.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{b.text}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

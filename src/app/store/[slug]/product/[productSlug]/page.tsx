import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight, ArrowRight } from "lucide-react"
import { db } from "@/lib/db"
import { ProductCard } from "@/components/store/product-card"
import { ProductView } from "@/components/store/product-view"
import { AnimatedSection } from "@/components/ui/animated-section"

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
    take: 8,
  })

  const base = `/store/${slug}`

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-[#bbb] mb-6 flex-wrap">
          <Link href={base} className="hover:text-[#666] transition-colors">Главная</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-[#d0d0d0]" />
          <Link href={`${base}/catalog`} className="hover:text-[#666] transition-colors">Каталог</Link>
          {product.category?.parent && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0 text-[#d0d0d0]" />
              <Link href={`${base}/catalog?category=${product.category.parent.slug}`} className="hover:text-[#666] transition-colors">
                {product.category.parent.name}
              </Link>
            </>
          )}
          {product.category && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0 text-[#d0d0d0]" />
              <Link href={`${base}/catalog?category=${product.category.slug}`} className="hover:text-[#666] transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3 shrink-0 text-[#d0d0d0]" />
          <span className="text-[#666] font-medium truncate max-w-[200px]">{product.name}</span>
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

        {/* Description */}
        {product.description && (
          <div className="glass rounded-2xl overflow-hidden mb-10 animate-slide-up delay-200">
            <div className="px-6 py-4 border-b border-[#e8e8e8]">
              <p className="label-tag mb-1 text-[#999]">— ДЕТАЛИ</p>
              <h2 className="text-lg font-black text-[#1a1a1a]">Описание и характеристики</h2>
            </div>
            <div
              className="p-6 product-description"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        {/* Related products */}
        {related.length > 0 && (
          <section className="py-16 sm:py-24 -mx-4 px-0 bg-[#f7f7f7] mt-12">
            <div className="max-w-7xl mx-auto">
              <AnimatedSection>
                <div className="px-6 sm:px-10 relative mb-10">
                  <div
                    className="editorial-num absolute -top-4 right-4 pointer-events-none select-none z-0"
                  >
                    ещё
                  </div>
                  <div className="relative z-10">
                    <p className="label-tag mb-3">— ПОХОЖЕЕ</p>
                    <div className="flex items-end justify-between gap-4">
                      <h2
                        className="font-bold text-[#0a0a0a] tracking-tight leading-none"
                        style={{ fontSize: "clamp(32px, 5vw, 64px)", letterSpacing: "-0.03em" }}
                      >
                        Похожие товары
                      </h2>
                      {product.category && (
                        <Link
                          href={`${base}/catalog?category=${product.category.slug}`}
                          className="label-tag text-[#999] hover:text-[#F26522] flex items-center gap-1 transition-colors shrink-0 pb-1"
                        >
                          ВСЕ <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              <div
                className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-hide pb-4 px-6 sm:px-10 snap-x snap-mandatory"
                style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
              >
                {related.map((p, i) => (
                  <div key={p.id} className="w-[160px] sm:w-[210px] lg:w-[250px] shrink-0 snap-start">
                    <ProductCard product={p} storeSlug={slug} index={i} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

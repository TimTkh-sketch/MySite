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
    where: { storeId: store.id, isActive: true, categoryId: product.categoryId, id: { not: product.id } },
    orderBy: { isFeatured: "desc" },
    take: 8,
  })

  const base = `/store/${slug}`

  return (
    <div className="min-h-screen" style={{ background: "#000", paddingTop: 60 }}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-8 flex-wrap" style={{ fontSize: 12 }}>
          <Link href={base} style={{ color: "var(--text-3)", textDecoration: "none" }}>Главная</Link>
          <ChevronRight className="h-3 w-3" style={{ color: "var(--text-3)" }} />
          <Link href={`${base}/catalog`} style={{ color: "var(--text-3)", textDecoration: "none" }}>Каталог</Link>
          {product.category?.parent && (
            <>
              <ChevronRight className="h-3 w-3" style={{ color: "var(--text-3)" }} />
              <Link href={`${base}/catalog?category=${product.category.parent.slug}`} style={{ color: "var(--text-3)", textDecoration: "none" }}>
                {product.category.parent.name}
              </Link>
            </>
          )}
          {product.category && (
            <>
              <ChevronRight className="h-3 w-3" style={{ color: "var(--text-3)" }} />
              <Link href={`${base}/catalog?category=${product.category.slug}`} style={{ color: "var(--text-3)", textDecoration: "none" }}>
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" style={{ color: "var(--text-3)" }} />
          <span style={{ color: "var(--text-2)", fontWeight: 500 }} className="truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Product */}
        <div className="mb-12">
          <ProductView
            product={{ id: product.id, name: product.name, price: product.price, comparePrice: product.comparePrice, images: product.images, slug: product.slug, stock: product.stock, sku: product.sku }}
            variants={product.variants.map(v => ({ id: v.id, name: v.name, value: v.value, price: v.price, stock: v.stock, image: (v as unknown as { image: string | null }).image ?? null }))}
            colorImages={Object.fromEntries(product.colorImages.map(ci => [ci.colorValue, ci.images]))}
            phone={store.settings?.phone}
          />
        </div>

        {/* Description */}
        {product.description && (
          <div className="rounded-2xl overflow-hidden mb-12 animate-slide-up delay-200" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="label-tag mb-1" style={{ opacity: 0.6 }}>— детали</p>
              <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "#fff" }}>Описание и характеристики</h2>
            </div>
            <div className="p-6 product-description" dangerouslySetInnerHTML={{ __html: product.description }} />
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section style={{ marginTop: 60, paddingTop: 60, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <AnimatedSection>
              <div className="flex items-end justify-between mb-10">
                <div>
                  <p className="label-tag mb-3">— похожее</p>
                  <h2 style={{ fontSize: "clamp(32px, 5vw, 60px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.88, color: "#fff" }}>
                    Похожие<br /><span style={{ color: "var(--accent)" }}>товары</span>
                  </h2>
                </div>
                {product.category && (
                  <Link
                    href={`${base}/catalog?category=${product.category.slug}`}
                    className="hidden sm:flex items-center gap-1.5 pb-2"
                    style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", textDecoration: "none" }}
                  >
                    Все <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </AnimatedSection>

            <div
              className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
              style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
            >
              {related.map((p, i) => (
                <div key={p.id} className="w-[180px] sm:w-[220px] lg:w-[260px] shrink-0 snap-start">
                  <ProductCard product={p} storeSlug={slug} index={i} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

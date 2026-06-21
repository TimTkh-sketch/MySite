import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { AnimatedSection } from "@/components/ui/animated-section"
import { WishlistGrid } from "./wishlist-grid"

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const store = await db.store.findUnique({
    where: { slug, isActive: true },
    select: { id: true, name: true },
  })
  if (!store) notFound()

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
        <AnimatedSection>
          <div className="mb-10">
            <p className="label-tag mb-3">— СОХРАНЁННОЕ</p>
            <h1
              className="font-bold text-[#0a0a0a] tracking-tight leading-none"
              style={{ fontSize: "clamp(36px, 5vw, 72px)", letterSpacing: "-0.03em" }}
            >
              Избранное
            </h1>
          </div>
        </AnimatedSection>

        <WishlistGrid storeSlug={slug} />
      </div>
    </div>
  )
}

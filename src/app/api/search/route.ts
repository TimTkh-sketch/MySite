import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() ?? ""
  const storeSlug = searchParams.get("storeSlug") ?? ""

  if (q.length < 2 || !storeSlug) {
    return NextResponse.json({ products: [] })
  }

  const store = await db.store.findUnique({
    where: { slug: storeSlug, isActive: true },
    select: { id: true },
  })

  if (!store) return NextResponse.json({ products: [] })

  const products = await db.product.findMany({
    where: {
      storeId: store.id,
      isActive: true,
      name: { contains: q, mode: "insensitive" },
    },
    select: { id: true, name: true, slug: true, price: true, images: true },
    orderBy: { isFeatured: "desc" },
    take: 8,
  })

  return NextResponse.json({ products })
}

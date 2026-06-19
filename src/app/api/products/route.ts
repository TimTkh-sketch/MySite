import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("storeId")
  const categoryId = searchParams.get("categoryId")
  const featured = searchParams.get("featured")

  const products = await db.product.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(featured === "true" ? { isFeatured: true } : {}),
      isActive: true,
    },
    include: { category: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(products)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const {
    storeId, categoryId, name, slug, description,
    price, comparePrice, sku, stock, isActive, isFeatured, images, tags,
  } = body

  if (!storeId || !name || !slug || price === undefined) {
    return NextResponse.json({ error: "Обязательные поля не заполнены" }, { status: 400 })
  }

  const existing = await db.product.findUnique({ where: { storeId_slug: { storeId, slug } } })
  if (existing) {
    return NextResponse.json({ error: "Товар с таким слагом уже существует" }, { status: 400 })
  }

  const product = await db.product.create({
    data: {
      storeId, categoryId: categoryId || null,
      name, slug, description: description || null,
      price, comparePrice: comparePrice || null,
      sku: sku || null, stock: stock ?? 0,
      isActive: isActive ?? true, isFeatured: isFeatured ?? false,
      images: images ?? [], tags: tags ?? [],
    },
  })

  return NextResponse.json(product, { status: 201 })
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const product = await db.product.update({
    where: { id },
    data: {
      storeId: body.storeId,
      categoryId: body.categoryId || null,
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      price: body.price,
      comparePrice: body.comparePrice || null,
      sku: body.sku || null,
      stock: body.stock ?? 0,
      isActive: body.isActive ?? true,
      isFeatured: body.isFeatured ?? false,
      images: body.images ?? [],
      tags: body.tags ?? [],
    },
  })

  return NextResponse.json(product)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.product.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}

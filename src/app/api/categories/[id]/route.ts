import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const category = await db.category.update({
    where: { id },
    data: {
      storeId: body.storeId,
      parentId: body.parentId || null,
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  })

  return NextResponse.json(category)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.category.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}

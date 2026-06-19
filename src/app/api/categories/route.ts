import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("storeId")

  const categories = await db.category.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      isActive: true,
    },
    include: { children: true },
    orderBy: { sortOrder: "asc" },
  })

  return NextResponse.json(categories)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { storeId, parentId, name, slug, description, isActive, sortOrder } = body

  const category = await db.category.create({
    data: {
      storeId, parentId: parentId || null,
      name, slug, description: description || null,
      isActive: isActive ?? true, sortOrder: sortOrder ?? 0,
    },
  })

  return NextResponse.json(category, { status: 201 })
}

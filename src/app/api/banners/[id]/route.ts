import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const banner = await db.banner.update({
    where: { id },
    data: {
      storeId: body.storeId,
      title: body.title,
      subtitle: body.subtitle,
      image: body.image,
      link: body.link,
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  })

  return NextResponse.json(banner)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.banner.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}

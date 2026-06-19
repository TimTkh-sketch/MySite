import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const banner = await db.banner.create({
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

  return NextResponse.json(banner, { status: 201 })
}

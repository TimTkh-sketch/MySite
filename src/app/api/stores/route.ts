import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const stores = await db.store.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true, orders: true } } },
  })

  return NextResponse.json(stores)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, slug, domain, description, primaryColor, accentColor, settings } = body

  if (!name || !slug) {
    return NextResponse.json({ error: "Название и слаг обязательны" }, { status: 400 })
  }

  const existing = await db.store.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: "Магазин с таким слагом уже существует" }, { status: 400 })
  }

  const store = await db.store.create({
    data: {
      name,
      slug,
      domain: domain || null,
      description: description || null,
      primaryColor: primaryColor || "#1a1a1a",
      accentColor: accentColor || "#e53e3e",
      settings: settings
        ? {
            create: {
              phone: settings.phone,
              address: settings.address,
              workingHours: settings.workingHours,
              freeShippingFrom: settings.freeShippingFrom,
            },
          }
        : undefined,
    },
  })

  return NextResponse.json(store, { status: 201 })
}

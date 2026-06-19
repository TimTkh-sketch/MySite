import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, slug, domain, description, primaryColor, accentColor, settings } = body

  const store = await db.store.update({
    where: { id },
    data: {
      name,
      slug,
      domain: domain || null,
      description: description || null,
      primaryColor,
      accentColor,
      settings: settings
        ? {
            upsert: {
              create: {
                phone: settings.phone,
                address: settings.address,
                workingHours: settings.workingHours,
                freeShippingFrom: settings.freeShippingFrom,
              },
              update: {
                phone: settings.phone,
                address: settings.address,
                workingHours: settings.workingHours,
                freeShippingFrom: settings.freeShippingFrom,
              },
            },
          }
        : undefined,
    },
  })

  return NextResponse.json(store)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.store.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}

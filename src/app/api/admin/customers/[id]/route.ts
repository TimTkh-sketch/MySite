import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      bonusCard: true,
      bonusHistory: { orderBy: { createdAt: "desc" }, take: 50 },
      notifications: { orderBy: { sentAt: "desc" }, take: 20 },
    },
  })
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const { password: _, ...safe } = customer
  return NextResponse.json(safe)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { firstName, lastName, middleName, phone, birthDate, gender, email } = body

  const customer = await db.customer.update({
    where: { id },
    data: {
      firstName:  firstName  ?? undefined,
      lastName:   lastName   ?? undefined,
      middleName: middleName ?? undefined,
      phone:      phone      ?? undefined,
      email:      email      ?? undefined,
      birthDate:  birthDate ? new Date(birthDate) : undefined,
      gender:     gender     ?? undefined,
    },
    include: { bonusCard: true },
  })

  const { password: _, ...safe } = customer
  return NextResponse.json(safe)
}

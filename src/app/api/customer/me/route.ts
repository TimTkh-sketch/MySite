import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCustomerIdFromRequest } from "@/lib/customer-jwt"

export async function GET(req: Request) {
  const customerId = await getCustomerIdFromRequest(req)
  if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const customer = await db.customer.findUnique({
    where: { id: customerId },
    include: { bonusCard: true },
  })
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { password: _, ...safe } = customer
  return NextResponse.json(safe)
}

export async function PATCH(req: Request) {
  const customerId = await getCustomerIdFromRequest(req)
  if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { firstName, lastName, middleName, phone, birthDate, gender } = body

  const customer = await db.customer.update({
    where: { id: customerId },
    data: {
      firstName:  firstName  ?? undefined,
      lastName:   lastName   ?? undefined,
      middleName: middleName ?? undefined,
      phone:      phone      ?? undefined,
      birthDate:  birthDate  ? new Date(birthDate) : undefined,
      gender:     gender     ?? undefined,
    },
    include: { bonusCard: true },
  })

  const { password: _, ...safe } = customer
  return NextResponse.json(safe)
}

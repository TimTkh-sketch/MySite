import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { getCustomerIdFromRequest } from "@/lib/customer-jwt"

export async function PATCH(req: Request) {
  const customerId = await getCustomerIdFromRequest(req)
  if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { oldPassword, newPassword } = await req.json()
  const customer = await db.customer.findUnique({ where: { id: customerId } })
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const valid = await bcrypt.compare(oldPassword, customer.password)
  if (!valid) return NextResponse.json({ error: "Неверный текущий пароль" }, { status: 400 })

  const hash = await bcrypt.hash(newPassword, 12)
  await db.customer.update({ where: { id: customerId }, data: { password: hash } })
  return NextResponse.json({ ok: true })
}

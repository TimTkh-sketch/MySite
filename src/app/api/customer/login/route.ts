import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { signCustomerToken } from "@/lib/customer-jwt"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  const customer = await db.customer.findUnique({ where: { email } })
  if (!customer) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, customer.password)
  if (!valid) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 })
  }

  const token = await signCustomerToken(customer.id)
  const res = NextResponse.json({ ok: true })
  res.cookies.set("customer_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })
  return res
}

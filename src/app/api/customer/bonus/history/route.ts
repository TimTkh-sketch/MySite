import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCustomerIdFromRequest } from "@/lib/customer-jwt"

export async function GET(req: Request) {
  const customerId = await getCustomerIdFromRequest(req)
  if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = 20

  const [transactions, total] = await Promise.all([
    db.bonusTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.bonusTransaction.count({ where: { customerId } }),
  ])

  return NextResponse.json({ transactions, total, page, pages: Math.ceil(total / limit) })
}

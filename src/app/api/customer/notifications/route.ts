import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCustomerIdFromRequest } from "@/lib/customer-jwt"

export async function GET(req: Request) {
  const customerId = await getCustomerIdFromRequest(req)
  if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const notifications = await db.customerNotification.findMany({
    where: { customerId },
    orderBy: { sentAt: "desc" },
    take: 50,
  })
  return NextResponse.json(notifications)
}

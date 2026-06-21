import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCustomerIdFromRequest } from "@/lib/customer-jwt"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const customerId = await getCustomerIdFromRequest(req)
  if (!customerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await db.customerNotification.updateMany({
    where: { id, customerId },
    data: { isRead: true },
  })
  return NextResponse.json({ ok: true })
}

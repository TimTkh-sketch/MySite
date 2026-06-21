import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const { customerIds, title, message, type } = await req.json()

  if (!title || !message) {
    return NextResponse.json({ error: "title and message required" }, { status: 400 })
  }

  const ids: string[] = customerIds && customerIds.length > 0
    ? customerIds
    : (await db.customer.findMany({ select: { id: true } })).map((c: { id: string }) => c.id)

  await db.customerNotification.createMany({
    data: ids.map((customerId: string) => ({
      customerId,
      type: type ?? "manual",
      title,
      message,
    })),
  })

  return NextResponse.json({ sent: ids.length })
}

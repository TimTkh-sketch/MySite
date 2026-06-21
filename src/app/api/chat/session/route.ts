import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const { storeId, visitorName, visitorPage } = await req.json()
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 })

  const session = await db.chatSession.create({
    data: { storeId, visitorName: visitorName || null, visitorPage: visitorPage || null },
  })
  return NextResponse.json(session, { status: 201 })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("storeId")
  const status = searchParams.get("status")

  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 })

  // Auto-restore postponed sessions whose time has passed
  await db.chatSession.updateMany({
    where: {
      storeId,
      status: "postponed",
      postponedUntil: { lte: new Date() },
    },
    data: { status: "waiting", postponedUntil: null, operatorId: null },
  })

  // Build filter
  const where: Record<string, unknown> = { storeId }
  if (status) {
    where.status = status
  }

  const sessions = await db.chatSession.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  })

  const withUnread = await Promise.all(
    sessions.map(async (s) => {
      const unread = await db.chatMessage.count({
        where: { sessionId: s.id, isRead: false, sender: "visitor" },
      })
      return { ...s, unreadCount: unread }
    })
  )

  return NextResponse.json(withUnread)
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("sessionId")
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 })

  const messages = await db.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(messages)
}

export async function POST(req: Request) {
  const { sessionId, text, sender } = await req.json()
  if (!sessionId || !text || !sender) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const message = await db.chatMessage.create({
    data: { sessionId, text, sender },
  })

  // Update session updatedAt
  await db.chatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  })

  // Auto bot reply if visitor message and no operators online
  if (sender === "visitor") {
    const session = await db.chatSession.findUnique({ where: { id: sessionId } })
    if (session) {
      const onlineOps = await db.chatOperator.count({
        where: { storeId: session.storeId, isOnline: true },
      })
      if (onlineOps === 0) {
        const settings = await db.chatSettings.findUnique({
          where: { storeId: session.storeId },
        })
        const botText =
          settings?.botReply ||
          "Операторы сейчас недоступны. Оставьте вопрос — мы ответим в ближайшее время!"
        await db.chatMessage.create({
          data: { sessionId, text: botText, sender: "bot" },
        })
        await db.chatSession.update({
          where: { id: sessionId },
          data: { updatedAt: new Date() },
        })
      }
    }
  }

  // Mark visitor messages as read when operator sends
  if (sender === "operator") {
    await db.chatMessage.updateMany({
      where: { sessionId, sender: "visitor", isRead: false },
      data: { isRead: true },
    })
  }

  return NextResponse.json(message, { status: 201 })
}

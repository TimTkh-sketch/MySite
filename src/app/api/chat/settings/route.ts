import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("storeId")
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 })

  const settings = await db.chatSettings.findUnique({ where: { storeId } })
  return NextResponse.json(
    settings ?? {
      storeId,
      botReply: "Операторы сейчас недоступны. Оставьте вопрос — мы ответим в ближайшее время!",
      quickReplies: ["Здравствуйте!", "Одну минуту, пожалуйста", "Уточните, пожалуйста"],
    }
  )
}

export async function PUT(req: Request) {
  const body = await req.json()
  const { storeId, botReply, quickReplies } = body
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 })

  const settings = await db.chatSettings.upsert({
    where: { storeId },
    update: {
      ...(botReply !== undefined ? { botReply } : {}),
      ...(quickReplies !== undefined ? { quickReplies } : {}),
    },
    create: {
      storeId,
      botReply: botReply ?? null,
      quickReplies: quickReplies ?? [],
    },
  })
  return NextResponse.json(settings)
}

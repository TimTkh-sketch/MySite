import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("storeId")
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 })

  const operators = await db.chatOperator.findMany({ where: { storeId } })
  return NextResponse.json(operators)
}

export async function POST(req: Request) {
  const { storeId, name, avatar } = await req.json()
  if (!storeId || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const op = await db.chatOperator.create({ data: { storeId, name, avatar: avatar || null } })
  return NextResponse.json(op, { status: 201 })
}

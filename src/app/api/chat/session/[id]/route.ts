import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { status, operatorId, postponedUntil } = body

  const data: Record<string, unknown> = {}
  if (status !== undefined)        data.status = status
  if (operatorId !== undefined)    data.operatorId = operatorId
  if (postponedUntil !== undefined) data.postponedUntil = postponedUntil ? new Date(postponedUntil) : null

  const session = await db.chatSession.update({ where: { id }, data })
  return NextResponse.json(session)
}

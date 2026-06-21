import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const op = await db.chatOperator.update({ where: { id }, data: body })
  return NextResponse.json(op)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.chatOperator.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

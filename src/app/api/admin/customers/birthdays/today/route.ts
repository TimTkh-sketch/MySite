import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const today = new Date()
  const month = today.getMonth() + 1
  const day   = today.getDate()

  const all = await db.customer.findMany({
    where: { birthDate: { not: null } },
    include: { bonusCard: true },
  })

  const birthdays = all.filter(c => {
    if (!c.birthDate) return false
    const bd = new Date(c.birthDate)
    return bd.getMonth() + 1 === month && bd.getDate() === day
  })

  return NextResponse.json(birthdays.map(({ password: _, ...c }) => c))
}

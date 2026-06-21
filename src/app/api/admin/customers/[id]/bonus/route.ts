import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getTier } from "@/lib/bonus"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { amount, description, type } = await req.json()

  if (!amount || !description) {
    return NextResponse.json({ error: "amount and description required" }, { status: 400 })
  }

  const card = await db.bonusCard.findUnique({ where: { customerId: id } })
  if (!card) return NextResponse.json({ error: "Bonus card not found" }, { status: 404 })

  await db.bonusTransaction.create({
    data: { customerId: id, type: type ?? "admin", amount, description },
  })

  const newBalance  = Math.max(0, card.balance + amount)
  const newEarned   = amount > 0 ? card.totalEarned + amount : card.totalEarned
  const newSpent    = amount < 0 ? card.totalSpent + Math.abs(amount) : card.totalSpent
  const newTier     = getTier(newEarned)

  const updated = await db.bonusCard.update({
    where: { customerId: id },
    data: { balance: newBalance, totalEarned: newEarned, totalSpent: newSpent, tier: newTier },
  })

  return NextResponse.json(updated)
}

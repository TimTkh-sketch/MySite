import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q       = searchParams.get("q")     ?? ""
  const tier    = searchParams.get("tier")  ?? ""
  const sortBy  = searchParams.get("sort")  ?? "createdAt"
  const bday    = searchParams.get("bday")  ?? ""
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit   = 20

  const today = new Date()
  const month = today.getMonth() + 1
  const day   = today.getDate()

  const customers = await db.customer.findMany({
    include: { bonusCard: true },
    orderBy: sortBy === "balance"
      ? { bonusCard: { balance: "desc" } }
      : { createdAt: "desc" },
  })

  let result = customers

  if (q) {
    const lq = q.toLowerCase()
    result = result.filter(c =>
      c.firstName.toLowerCase().includes(lq) ||
      c.lastName.toLowerCase().includes(lq) ||
      c.email.toLowerCase().includes(lq) ||
      (c.phone ?? "").includes(lq) ||
      (c.bonusCard?.cardNumber ?? "").toLowerCase().includes(lq)
    )
  }

  if (tier) {
    result = result.filter(c => c.bonusCard?.tier === tier)
  }

  if (bday === "today") {
    result = result.filter(c => {
      if (!c.birthDate) return false
      const bd = new Date(c.birthDate)
      return bd.getMonth() + 1 === month && bd.getDate() === day
    })
  } else if (bday === "month") {
    result = result.filter(c => {
      if (!c.birthDate) return false
      return new Date(c.birthDate).getMonth() + 1 === month
    })
  }

  const total = result.length
  const paged = result.slice((page - 1) * limit, page * limit)

  return NextResponse.json({ customers: paged, total, page, pages: Math.ceil(total / limit) })
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma/client"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const q          = searchParams.get("q")          ?? ""
  const tier       = searchParams.get("tier")       ?? ""
  const gender     = searchParams.get("gender")     ?? ""
  const bday       = searchParams.get("bday")       ?? ""
  const balanceMin = searchParams.get("balanceMin") ?? ""
  const balanceMax = searchParams.get("balanceMax") ?? ""
  const regFrom    = searchParams.get("regFrom")    ?? ""
  const regTo      = searchParams.get("regTo")      ?? ""
  const inactive   = searchParams.get("inactive")   ?? ""   // дней без активности (сгорание)
  const sortBy     = searchParams.get("sort")       ?? "createdAt"
  const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit      = 20

  const today = new Date()
  const month = today.getMonth() + 1
  const day   = today.getDate()

  // Customers at risk of expiry: have balance > 0 but no transaction in last N days
  let inactiveExcludeIds: string[] | null = null
  if (inactive) {
    const days   = Number(inactive)
    const cutoff = new Date(Date.now() - days * 86_400_000)
    const recent = await db.bonusTransaction.findMany({
      where:    { createdAt: { gte: cutoff } },
      select:   { customerId: true },
      distinct: ["customerId"],
    })
    inactiveExcludeIds = recent.map((t) => t.customerId)
  }

  const where: Prisma.CustomerWhereInput = {}

  // Text search
  if (q) {
    where.OR = [
      { firstName:  { contains: q, mode: "insensitive" } },
      { lastName:   { contains: q, mode: "insensitive" } },
      { email:      { contains: q, mode: "insensitive" } },
      { phone:      { contains: q } },
      { bonusCard:  { cardNumber: { contains: q } } },
    ]
  }

  // Gender
  if (gender) where.gender = gender

  // Registration date range
  if (regFrom || regTo) {
    where.createdAt = {
      ...(regFrom ? { gte: new Date(regFrom) } : {}),
      ...(regTo   ? { lte: new Date(regTo + "T23:59:59") } : {}),
    }
  }

  // Birthday filter
  if (bday === "today") {
    // JS-level filter applied below (Prisma can't filter by month+day without raw SQL)
  } else if (bday === "month") {
    // JS-level filter applied below
  }

  // Bonus card filters
  const bonusWhere: Prisma.BonusCardWhereInput = {}
  if (tier) bonusWhere.tier = tier
  if (balanceMin) bonusWhere.balance = { ...bonusWhere.balance as object, gte: Number(balanceMin) }
  if (balanceMax) bonusWhere.balance = { ...bonusWhere.balance as object, lte: Number(balanceMax) }
  // Сгорание: balance > 0 and not recently active
  if (inactiveExcludeIds !== null) bonusWhere.balance = { ...bonusWhere.balance as object, gt: 0 }
  if (Object.keys(bonusWhere).length) where.bonusCard = bonusWhere

  // Exclude recently active customers (for сгорание filter)
  if (inactiveExcludeIds !== null) {
    where.id = { notIn: inactiveExcludeIds }
  }

  // Fetch with sort
  const orderBy: Prisma.CustomerOrderByWithRelationInput =
    sortBy === "balance"      ? { bonusCard: { balance: "desc" } }      :
    sortBy === "totalEarned"  ? { bonusCard: { totalEarned: "desc" } }  :
    sortBy === "lastName"     ? { lastName: "asc" }                     :
                                { createdAt: "desc" }

  let customers = await db.customer.findMany({
    where,
    include: { bonusCard: true },
    orderBy,
  })

  // JS-level birthday filters (month/day comparison)
  if (bday === "today") {
    customers = customers.filter((c) => {
      if (!c.birthDate) return false
      const bd = new Date(c.birthDate)
      return bd.getMonth() + 1 === month && bd.getDate() === day
    })
  } else if (bday === "month") {
    customers = customers.filter((c) => {
      if (!c.birthDate) return false
      return new Date(c.birthDate).getMonth() + 1 === month
    })
  }

  const total = customers.length
  const paged = customers.slice((page - 1) * limit, page * limit)

  return NextResponse.json({
    customers: paged,
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}

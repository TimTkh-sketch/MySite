import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { signCustomerToken } from "@/lib/customer-jwt"
import { generateCardNumber } from "@/lib/bonus"

export async function POST(req: Request) {
  const body = await req.json()
  const { email, password, firstName, lastName, middleName, phone, birthDate, gender } = body

  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json({ error: "Заполните обязательные поля" }, { status: 400 })
  }

  const exists = await db.customer.findUnique({ where: { email } })
  if (exists) return NextResponse.json({ error: "Email уже зарегистрирован" }, { status: 409 })

  if (phone) {
    const phoneExists = await db.customer.findUnique({ where: { phone } })
    if (phoneExists) return NextResponse.json({ error: "Телефон уже занят" }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 12)

  const customer = await db.customer.create({
    data: {
      email,
      password: hash,
      firstName,
      lastName,
      middleName: middleName || null,
      phone: phone || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      gender: gender || null,
    },
  })

  // Create bonus card
  let cardNumber = generateCardNumber()
  // Ensure unique
  while (await db.bonusCard.findUnique({ where: { cardNumber } })) {
    cardNumber = generateCardNumber()
  }

  await db.bonusCard.create({
    data: { customerId: customer.id, cardNumber, balance: 500, totalEarned: 500, tier: "black" },
  })

  // Welcome bonus transaction
  await db.bonusTransaction.create({
    data: {
      customerId: customer.id,
      type: "earn",
      amount: 500,
      description: "Приветственные баллы при регистрации 🎁",
    },
  })

  // Welcome notification
  await db.customerNotification.create({
    data: {
      customerId: customer.id,
      type: "promo",
      title: "Добро пожаловать! 🎉",
      message: `${firstName}, вам начислено 500 приветственных баллов на любую покупку. Карта активирована — номер ${cardNumber}`,
    },
  })

  const token = await signCustomerToken(customer.id)
  const res = NextResponse.json({ ok: true, cardNumber }, { status: 201 })
  res.cookies.set("customer_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  })
  return res
}

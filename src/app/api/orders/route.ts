import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const body = await req.json()
  const { storeId, customerName, customerPhone, customerEmail, address, city, comment, subtotal, shipping, total, items } = body

  if (!storeId || !customerName || !customerPhone || !items?.length) {
    return NextResponse.json({ error: "Обязательные поля не заполнены" }, { status: 400 })
  }

  const lastOrder = await db.order.findFirst({
    where: { storeId },
    orderBy: { number: "desc" },
    select: { number: true },
  })

  const number = (lastOrder?.number ?? 0) + 1

  const order = await db.order.create({
    data: {
      storeId,
      number,
      customerName,
      customerPhone: customerPhone || null,
      customerEmail: customerEmail || null,
      address: address || null,
      city: city || null,
      comment: comment || null,
      subtotal,
      shipping: shipping ?? 0,
      total,
      items: {
        create: items.map((item: { productId: string; name: string; price: number; quantity: number; image?: string }) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || null,
        })),
      },
    },
  })

  return NextResponse.json(order, { status: 201 })
}

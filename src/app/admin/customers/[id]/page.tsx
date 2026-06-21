import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { CustomerDetail } from "./customer-detail"

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      bonusCard: true,
      bonusHistory: { orderBy: { createdAt: "desc" }, take: 50 },
      notifications: { orderBy: { sentAt: "desc" }, take: 20 },
    },
  })
  if (!customer) notFound()

  const orders = await db.order.findMany({
    where: { customerEmail: customer.email },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  })

  const { password: _, ...safe } = customer
  return <CustomerDetail customer={safe} orders={orders} />
}

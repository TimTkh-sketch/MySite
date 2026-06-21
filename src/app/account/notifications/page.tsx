import { redirect } from "next/navigation"
import { getCustomerSession } from "@/lib/get-customer-session"
import { db } from "@/lib/db"
import { NotificationsList } from "./notifications-list"

export default async function NotificationsPage() {
  const customer = await getCustomerSession()
  if (!customer) redirect("/customer/login")

  const notifications = await db.customerNotification.findMany({
    where: { customerId: customer.id },
    orderBy: { sentAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Уведомления</h1>
      <NotificationsList notifications={notifications} />
    </div>
  )
}

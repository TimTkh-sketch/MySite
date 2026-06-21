import { redirect } from "next/navigation"
import { getCustomerSession } from "@/lib/get-customer-session"
import { db } from "@/lib/db"

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Новый", CONFIRMED: "Подтверждён", PROCESSING: "В обработке",
  SHIPPED: "Отправлен", DELIVERED: "Доставлен", CANCELLED: "Отменён",
}
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600", CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-amber-100 text-amber-700", SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-emerald-100 text-emerald-700", CANCELLED: "bg-red-100 text-red-600",
}

export default async function StoreOrdersPage() {
  const customer = await getCustomerSession()
  if (!customer) redirect("/customer/login")

  const orders = await db.order.findMany({
    where: { customerEmail: customer.email },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Мои заказы</h1>
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-3xl mb-2">📦</p>
          <p className="text-sm text-gray-400">Заказов ещё нет</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">Заказ #{o.number}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(o.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {STATUS_LABELS[o.status] ?? o.status}
                </span>
              </div>
              <div className="space-y-1 mb-3">
                {o.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{item.name} × {item.quantity}</span>
                    <span className="font-medium text-gray-900">{(item.price * item.quantity).toLocaleString("ru")} ₽</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400">{o.items.length} {o.items.length === 1 ? "товар" : "товара"}</span>
                <span className="font-black text-gray-900">{o.total.toLocaleString("ru")} ₽</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

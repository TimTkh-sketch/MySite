import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Package, ShoppingCart, Store, TrendingUp } from "lucide-react"
import { formatPrice } from "@/lib/utils"

export default async function AdminDashboard() {
  const session = await auth()
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"

  const [storesCount, productsCount, ordersCount, recentOrders] = await Promise.all([
    db.store.count(),
    db.product.count(),
    db.order.count(),
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { store: { select: { name: true } } },
    }),
  ])

  const revenue = await db.order.aggregate({
    _sum: { total: true },
    where: { paymentStatus: "PAID" },
  })

  const stats = [
    { label: "Магазины", value: storesCount, icon: Store, color: "bg-blue-100 text-blue-600" },
    { label: "Товары", value: productsCount, icon: Package, color: "bg-green-100 text-green-600" },
    { label: "Заказы", value: ordersCount, icon: ShoppingCart, color: "bg-orange-100 text-orange-600" },
    {
      label: "Выручка",
      value: formatPrice(revenue._sum.total ?? 0),
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600",
    },
  ]

  const statusLabels: Record<string, string> = {
    PENDING: "Новый",
    CONFIRMED: "Подтверждён",
    PROCESSING: "В обработке",
    SHIPPED: "Отправлен",
    DELIVERED: "Доставлен",
    CANCELLED: "Отменён",
    REFUNDED: "Возврат",
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-indigo-100 text-indigo-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-2.5 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Последние заказы</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentOrders.length === 0 ? (
            <p className="p-5 text-sm text-gray-400">Заказов пока нет</p>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    #{order.number} — {order.customerName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.store.name} · {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status]}`}
                  >
                    {statusLabels[order.status]}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

import Link from "next/link"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"

const statusLabels: Record<string, string> = {
  PENDING: "Новый",
  CONFIRMED: "Подтверждён",
  PROCESSING: "В обработке",
  SHIPPED: "Отправлен",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
  REFUNDED: "Возврат",
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  PENDING: "warning",
  CONFIRMED: "default",
  PROCESSING: "default",
  SHIPPED: "secondary",
  DELIVERED: "success",
  CANCELLED: "destructive",
  REFUNDED: "outline",
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page ?? "1")
  const pageSize = 20
  const status = params.status

  const [orders, total] = await Promise.all([
    db.order.findMany({
      where: status ? { status: status as never } : undefined,
      include: {
        store: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.order.count({ where: status ? { status: status as never } : undefined }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Заказы</h1>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/orders">
          <Badge variant={!status ? "default" : "outline"} className="cursor-pointer px-3 py-1">
            Все ({total})
          </Badge>
        </Link>
        {Object.entries(statusLabels).map(([key, label]) => (
          <Link key={key} href={`/admin/orders?status=${key}`}>
            <Badge
              variant={status === key ? statusVariants[key] : "outline"}
              className="cursor-pointer px-3 py-1"
            >
              {label}
            </Badge>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">Заказов нет</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">№</th>
                <th className="px-5 py-3">Покупатель</th>
                <th className="px-5 py-3">Магазин</th>
                <th className="px-5 py-3">Товары</th>
                <th className="px-5 py-3">Сумма</th>
                <th className="px-5 py-3">Статус</th>
                <th className="px-5 py-3">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-mono font-medium text-gray-900">
                    #{order.number}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.customerPhone}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{order.store.name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{order.items.length} поз.</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={statusVariants[order.status]}>
                      {statusLabels[order.status]}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/orders?page=${p}${status ? `&status=${status}` : ""}`}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                p === page
                  ? "bg-gray-900 text-white border-gray-900"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

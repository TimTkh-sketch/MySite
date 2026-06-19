import Link from "next/link"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ExternalLink, Settings } from "lucide-react"

export default async function StoresPage() {
  const stores = await db.store.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { products: true, orders: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Магазины</h1>
        <Link href="/admin/stores/new">
          <Button>
            <Plus className="h-4 w-4" />
            Создать магазин
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {stores.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">Магазинов пока нет</p>
            <Link href="/admin/stores/new" className="mt-3 inline-block">
              <Button size="sm">Создать первый магазин</Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Название</th>
                <th className="px-5 py-3">Слаг / Домен</th>
                <th className="px-5 py-3">Товары</th>
                <th className="px-5 py-3">Заказы</th>
                <th className="px-5 py-3">Статус</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{store.name}</td>
                  <td className="px-5 py-3.5 text-gray-500">
                    <div className="font-mono text-xs">{store.slug}</div>
                    {store.domain && (
                      <div className="text-xs text-blue-500">{store.domain}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{store._count.products}</td>
                  <td className="px-5 py-3.5 text-gray-600">{store._count.orders}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={store.isActive ? "success" : "outline"}>
                      {store.isActive ? "Активен" : "Отключён"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/stores/${store.id}`}>
                        <Button size="sm" variant="outline">
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <a
                        href={`http://${store.slug}.localhost:3000`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

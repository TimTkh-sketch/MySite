import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { DeleteProductButton } from "@/components/admin/delete-product-button"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; page?: string }>
}) {
  const params = await searchParams
  const page = parseInt(params.page ?? "1")
  const pageSize = 20
  const storeId = params.store

  const stores = await db.store.findMany({ select: { id: true, name: true } })

  const [products, total] = await Promise.all([
    db.product.findMany({
      where: storeId ? { storeId } : undefined,
      include: {
        category: { select: { name: true } },
        store: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.product.count({ where: storeId ? { storeId } : undefined }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Товары</h1>
        <Link href="/admin/products/new">
          <Button>
            <Plus className="h-4 w-4" />
            Добавить товар
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <Link href="/admin/products">
          <Button size="sm" variant={!storeId ? "default" : "outline"}>
            Все
          </Button>
        </Link>
        {stores.map((s) => (
          <Link key={s.id} href={`/admin/products?store=${s.id}`}>
            <Button size="sm" variant={storeId === s.id ? "default" : "outline"}>
              {s.name}
            </Button>
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400">Товаров пока нет</p>
            <Link href="/admin/products/new" className="mt-3 inline-block">
              <Button size="sm">Добавить первый товар</Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Товар</th>
                <th className="px-5 py-3">Магазин</th>
                <th className="px-5 py-3">Цена</th>
                <th className="px-5 py-3">Остаток</th>
                <th className="px-5 py-3">Статус</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                          нет
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        {product.category && (
                          <p className="text-xs text-gray-500">{product.category.name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{product.store.name}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">{formatPrice(product.price)}</p>
                    {product.comparePrice && (
                      <p className="text-xs text-gray-400 line-through">
                        {formatPrice(product.comparePrice)}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={product.stock > 0 ? "success" : "destructive"}>
                      {product.stock > 0 ? `${product.stock} шт.` : "Нет"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={product.isActive ? "default" : "outline"}>
                      {product.isActive ? "Активен" : "Скрыт"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/products/${product.id}`}>
                        <Button size="sm" variant="outline">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <DeleteProductButton id={product.id} />
                    </div>
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
            <Link key={p} href={`/admin/products?page=${p}${storeId ? `&store=${storeId}` : ""}`}>
              <Button size="sm" variant={p === page ? "default" : "outline"}>
                {p}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

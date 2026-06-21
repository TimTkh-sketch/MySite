import Link from "next/link"
import { db } from "@/lib/db"
import { ChevronRight, Layers } from "lucide-react"
import { NewPropertyForm } from "./new-property-form"

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string }>
}) {
  const params = await searchParams
  const stores = await db.store.findMany({ select: { id: true, name: true }, take: 5 })
  const activeStoreId = params.store ?? stores[0]?.id

  const values = await db.propertyValue.findMany({
    where: { storeId: activeStoreId ?? "" },
    orderBy: [{ property: "asc" }, { sortOrder: "asc" }],
    select: { property: true },
  })

  const groups = new Map<string, number>()
  for (const v of values) {
    groups.set(v.property, (groups.get(v.property) ?? 0) + 1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Свойства вариантов</h1>
          <p className="text-sm text-gray-500 mt-0.5">{groups.size} свойств в базе</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Properties list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {groups.size === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">База свойств пуста.</p>
              <p className="text-xs mt-1">Добавьте первое свойство →</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/40">
                  <th className="px-4 py-3">Свойство</th>
                  <th className="px-4 py-3 text-right">Значений</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...groups.entries()].map(([property, count]) => (
                  <tr key={property} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/properties/${encodeURIComponent(property)}`}
                        className="text-sm font-medium text-gray-900 group-hover:text-orange-600 transition-colors"
                      >
                        {property}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-400">{count}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/properties/${encodeURIComponent(property)}`}>
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add new property form */}
        <NewPropertyForm storeId={activeStoreId ?? ""} />
      </div>
    </div>
  )
}

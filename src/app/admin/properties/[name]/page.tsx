import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { ChevronLeft } from "lucide-react"
import { PropertyValuesList } from "./property-values-list"

export default async function PropertyValuesPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>
  searchParams: Promise<{ store?: string }>
}) {
  const { name } = await params
  const sp = await searchParams
  const property = decodeURIComponent(name)

  const stores = await db.store.findMany({ select: { id: true, name: true }, take: 5 })
  const activeStoreId = sp.store ?? stores[0]?.id

  const values = await db.propertyValue.findMany({
    where: { storeId: activeStoreId ?? "", property },
    orderBy: { sortOrder: "asc" },
  })

  if (!activeStoreId) notFound()

  return (
    <div className="space-y-4 max-w-3xl">
      <Link
        href="/admin/properties"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Свойства вариантов
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">
        Значения свойства «{property}»
      </h1>

      <PropertyValuesList
        property={property}
        storeId={activeStoreId}
        initialValues={values.map((v) => ({ id: v.id, value: v.value, sortOrder: v.sortOrder }))}
      />
    </div>
  )
}

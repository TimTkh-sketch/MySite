import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { StoreForm } from "@/components/admin/store-form"

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const store = await db.store.findUnique({
    where: { id },
    include: { settings: true },
  })

  if (!store) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Настройки: {store.name}</h1>
      <StoreForm store={store} />
    </div>
  )
}

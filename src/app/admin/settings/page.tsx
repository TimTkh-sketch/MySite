import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SettingsForm } from "./settings-form"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const store = await db.store.findFirst({
    where: { isActive: true },
    include: { settings: true },
    orderBy: { createdAt: "asc" },
  })

  if (!store) {
    return (
      <div className="text-gray-500 text-sm">
        Нет активного магазина. <a href="/admin/stores/new" className="text-blue-600 underline">Создать магазин</a>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
        <p className="text-sm text-gray-500 mt-1">Магазин: {store.name}</p>
      </div>
      <SettingsForm store={store} />
    </div>
  )
}

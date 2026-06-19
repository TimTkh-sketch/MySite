import { db } from "@/lib/db"
import { BannerForm } from "@/components/admin/banner-form"

export default async function NewBannerPage() {
  const stores = await db.store.findMany({ select: { id: true, name: true } })
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Новый баннер</h1>
      <BannerForm stores={stores} />
    </div>
  )
}

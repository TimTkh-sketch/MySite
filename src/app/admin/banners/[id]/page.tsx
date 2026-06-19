import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { BannerForm } from "@/components/admin/banner-form"

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [banner, stores] = await Promise.all([
    db.banner.findUnique({ where: { id } }),
    db.store.findMany({ select: { id: true, name: true } }),
  ])
  if (!banner) notFound()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Редактировать баннер</h1>
      <BannerForm banner={banner} stores={stores} />
    </div>
  )
}

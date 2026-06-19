import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { DeleteBannerButton } from "@/components/admin/delete-banner-button"

export default async function BannersPage() {
  const banners = await db.banner.findMany({
    include: { store: { select: { name: true } } },
    orderBy: [{ storeId: "asc" }, { sortOrder: "asc" }],
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Баннеры</h1>
        <Link href="/admin/banners/new">
          <Button>
            <Plus className="h-4 w-4" />
            Добавить баннер
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.length === 0 ? (
          <div className="col-span-full rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-400">Баннеров пока нет</p>
          </div>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <div className="relative h-40 bg-gray-100">
                <Image src={banner.image} alt={banner.title} fill className="object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant={banner.isActive ? "success" : "outline"}>
                    {banner.isActive ? "Активен" : "Скрыт"}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <p className="font-medium text-gray-900">{banner.title}</p>
                {banner.subtitle && <p className="text-sm text-gray-500">{banner.subtitle}</p>}
                <p className="text-xs text-gray-400 mt-1">{banner.store.name}</p>
                <div className="flex gap-2 mt-3">
                  <Link href={`/admin/banners/${banner.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Изменить
                    </Button>
                  </Link>
                  <DeleteBannerButton id={banner.id} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

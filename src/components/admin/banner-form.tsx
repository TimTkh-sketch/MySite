"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload } from "lucide-react"

interface BannerFormProps {
  stores: { id: string; name: string }[]
  banner?: {
    id: string
    storeId: string
    title: string
    subtitle?: string | null
    image: string
    link?: string | null
    isActive: boolean
    sortOrder: number
  }
}

export function BannerForm({ stores, banner }: BannerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const [storeId, setStoreId] = useState(banner?.storeId ?? stores[0]?.id ?? "")
  const [title, setTitle] = useState(banner?.title ?? "")
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? "")
  const [image, setImage] = useState(banner?.image ?? "")
  const [link, setLink] = useState(banner?.link ?? "")
  const [isActive, setIsActive] = useState(banner?.isActive ?? true)
  const [sortOrder, setSortOrder] = useState(banner?.sortOrder?.toString() ?? "0")

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    const data = await res.json()
    if (data.url) setImage(data.url)
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!image) { setError("Загрузите изображение"); return }
    setLoading(true)
    setError("")

    const body = { storeId, title, subtitle: subtitle || null, image, link: link || null, isActive, sortOrder: parseInt(sortOrder) }
    const url = banner ? `/api/banners/${banner.id}` : "/api/banners"
    const method = banner ? "PATCH" : "POST"

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Ошибка"); setLoading(false); return }

    router.push("/admin/banners")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
        <div className="space-y-2">
          <Label>Изображение баннера *</Label>
          {image ? (
            <div className="relative h-48 w-full rounded-lg overflow-hidden border border-gray-200">
              <Image src={image} alt="banner" fill className="object-cover" />
            </div>
          ) : null}
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-900">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <Upload className="h-4 w-4" />
            {uploading ? "Загрузка..." : image ? "Заменить изображение" : "Загрузить изображение (рекомендуется 1920×600)"}
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Магазин *</Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Порядок</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Заголовок *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Летняя распродажа" required />
          </div>
          <div className="space-y-1.5">
            <Label>Подзаголовок</Label>
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Скидки до 50%" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Ссылка</Label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/catalog/sale" />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
          <span className="text-sm font-medium text-gray-700">Активен</span>
        </label>
      </div>

      {error && <p className="rounded-md bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>{loading ? "Сохранение..." : banner ? "Сохранить" : "Создать"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Отмена</Button>
      </div>
    </form>
  )
}

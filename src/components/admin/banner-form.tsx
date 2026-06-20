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
    type: string
    title: string
    subtitle?: string | null
    image: string
    link?: string | null
    buttonText?: string | null
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
  const [type, setType] = useState(banner?.type ?? "hero")
  const [title, setTitle] = useState(banner?.title ?? "")
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? "")
  const [image, setImage] = useState(banner?.image ?? "")
  const [link, setLink] = useState(banner?.link ?? "")
  const [buttonText, setButtonText] = useState(banner?.buttonText ?? "")
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

    const body = {
      storeId, type, title, subtitle: subtitle || null,
      image, link: link || null,
      buttonText: buttonText || null,
      isActive, sortOrder: parseInt(sortOrder),
    }
    const url = banner ? `/api/banners/${banner.id}` : "/api/banners"
    const method = banner ? "PATCH" : "POST"

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Ошибка"); setLoading(false); return }

    router.push("/admin/banners")
    router.refresh()
  }

  const isHero = type === "hero"

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">

        {/* Type selector */}
        <div className="space-y-2">
          <Label>Тип баннера</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("hero")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                type === "hero"
                  ? "border-orange-400 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-sm font-semibold text-gray-900 mb-1">Большой баннер</div>
              <div className="text-xs text-gray-500">Показывается в слайдере вверху страницы. Рекомендуемый размер: 1920×660 px</div>
            </button>
            <button
              type="button"
              onClick={() => setType("mini")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                type === "mini"
                  ? "border-orange-400 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-sm font-semibold text-gray-900 mb-1">Мини-баннер</div>
              <div className="text-xs text-gray-500">Показывается в ряду из 4 карточек под категориями. Рекомендуемый размер: 480×150 px</div>
            </button>
          </div>
        </div>

        {/* Image upload */}
        <div className="space-y-2">
          <Label>Изображение баннера *</Label>
          {image && (
            <div className={`relative w-full rounded-xl overflow-hidden border border-gray-200 ${isHero ? "h-48" : "h-28"}`}>
              <Image src={image} alt="banner preview" fill className="object-cover" />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-900 w-fit">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <Upload className="h-4 w-4" />
            {uploading ? "Загрузка..." : image ? "Заменить изображение" : `Загрузить изображение`}
          </label>
          {!image && (
            <div className="space-y-2 pt-1">
              <Label className="text-xs text-gray-400">или вставьте URL</Label>
              <Input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="text-sm"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Store */}
          <div className="space-y-1.5">
            <Label>Магазин *</Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Sort order */}
          <div className="space-y-1.5">
            <Label>Порядок</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Название (для внутреннего учёта)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={isHero ? "Летняя распродажа" : "Бонусная программа"} required />
          </div>

          {/* Link */}
          <div className="space-y-1.5">
            <Label>Ссылка (куда ведёт клик)</Label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/catalog" />
          </div>

          {/* Button text — only for hero */}
          {isHero && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Текст кнопки <span className="text-gray-400 font-normal">(необязательно — накладывается поверх изображения)</span></Label>
              <Input
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="Перейти, Купить, Выбрать услугу..."
              />
            </div>
          )}
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Активен</span>
        </label>
      </div>

      {error && <p className="rounded-md bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>{loading ? "Сохранение..." : banner ? "Сохранить" : "Создать баннер"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Отмена</Button>
      </div>
    </form>
  )
}

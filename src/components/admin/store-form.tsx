"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { slugify } from "@/lib/utils"

interface StoreFormProps {
  store?: {
    id: string
    name: string
    slug: string
    domain?: string | null
    description?: string | null
    primaryColor: string
    accentColor: string
    isActive: boolean
    settings?: {
      phone?: string | null
      address?: string | null
      workingHours?: string | null
      freeShippingFrom?: number | null
      shippingCost?: number | null
    } | null
  }
}

export function StoreForm({ store }: StoreFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [name, setName] = useState(store?.name ?? "")
  const [slug, setSlug] = useState(store?.slug ?? "")
  const [domain, setDomain] = useState(store?.domain ?? "")
  const [description, setDescription] = useState(store?.description ?? "")
  const [primaryColor, setPrimaryColor] = useState(store?.primaryColor ?? "#1a1a1a")
  const [accentColor, setAccentColor] = useState(store?.accentColor ?? "#e53e3e")
  const [phone, setPhone] = useState(store?.settings?.phone ?? "")
  const [address, setAddress] = useState(store?.settings?.address ?? "")
  const [workingHours, setWorkingHours] = useState(store?.settings?.workingHours ?? "")
  const [freeShippingFrom, setFreeShippingFrom] = useState(
    store?.settings?.freeShippingFrom?.toString() ?? ""
  )

  function handleNameChange(value: string) {
    setName(value)
    if (!store) setSlug(slugify(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const body = {
      name,
      slug,
      domain: domain || null,
      description: description || null,
      primaryColor,
      accentColor,
      settings: {
        phone: phone || null,
        address: address || null,
        workingHours: workingHours || null,
        freeShippingFrom: freeShippingFrom ? parseInt(freeShippingFrom) : null,
      },
    }

    const url = store ? `/api/stores/${store.id}` : "/api/stores"
    const method = store ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Ошибка при сохранении")
      setLoading(false)
      return
    }

    router.push("/admin/stores")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Основное</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Название магазина *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Мой магазин"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Слаг (URL) *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-store"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="domain">Домен</Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="mystore.ru"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Описание</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="О магазине..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="primaryColor">Основной цвет</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="primaryColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-gray-300"
              />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="accentColor">Акцентный цвет</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="accentColor"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-gray-300"
              />
              <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="font-mono" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Контакты и доставка</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (000) 000-00-00"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="workingHours">Часы работы</Label>
            <Input
              id="workingHours"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="Ежедневно 10:00-21:00"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Адрес</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="г. Пермь, ул. Горького, 64/1"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="freeShipping">Бесплатная доставка от (₽)</Label>
            <Input
              id="freeShipping"
              type="number"
              value={freeShippingFrom}
              onChange={(e) => setFreeShippingFrom(e.target.value)}
              placeholder="5000"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Сохранение..." : store ? "Сохранить изменения" : "Создать магазин"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>
    </form>
  )
}

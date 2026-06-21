"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveStoreSettings } from "./actions"

interface Props {
  store: {
    id: string
    name: string
    primaryColor: string
    accentColor: string
    settings?: {
      phone?: string | null
      address?: string | null
      workingHours?: string | null
      metaTitle?: string | null
      metaDesc?: string | null
      socialVk?: string | null
      socialTg?: string | null
      yandexMetrika?: string | null
      freeShippingFrom?: number | null
      shippingCost?: number | null
    } | null
  }
}

export function SettingsForm({ store }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const s = store.settings
  const [name, setName] = useState(store.name)
  const [primaryColor, setPrimaryColor] = useState(store.primaryColor)
  const [accentColor, setAccentColor] = useState(store.accentColor)
  const [phone, setPhone] = useState(s?.phone ?? "")
  const [address, setAddress] = useState(s?.address ?? "")
  const [workingHours, setWorkingHours] = useState(s?.workingHours ?? "")
  const [metaTitle, setMetaTitle] = useState(s?.metaTitle ?? "")
  const [metaDesc, setMetaDesc] = useState(s?.metaDesc ?? "")
  const [socialVk, setSocialVk] = useState(s?.socialVk ?? "")
  const [socialTg, setSocialTg] = useState(s?.socialTg ?? "")
  const [yandexMetrika, setYandexMetrika] = useState(s?.yandexMetrika ?? "")
  const [freeShippingFrom, setFreeShippingFrom] = useState(s?.freeShippingFrom?.toString() ?? "")
  const [shippingCost, setShippingCost] = useState(s?.shippingCost?.toString() ?? "")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    startTransition(async () => {
      try {
        await saveStoreSettings(store.id, {
          name,
          primaryColor,
          accentColor,
          phone: phone || null,
          address: address || null,
          workingHours: workingHours || null,
          metaTitle: metaTitle || null,
          metaDesc: metaDesc || null,
          socialVk: socialVk || null,
          socialTg: socialTg || null,
          yandexMetrika: yandexMetrika || null,
          freeShippingFrom: freeShippingFrom ? parseInt(freeShippingFrom) : null,
          shippingCost: shippingCost ? parseInt(shippingCost) : null,
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch {
        setError("Ошибка при сохранении")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Основное ─────────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Основное</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Название магазина</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="primaryColor">Основной цвет</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="primaryColor"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-gray-300"
              />
              <Input
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="font-mono"
                placeholder="#1a1a1a"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accentColor">Акцентный цвет</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="accentColor"
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-gray-300"
              />
              <Input
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                className="font-mono"
                placeholder="#F26522"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Контакты ─────────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Контакты</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Телефон</Label>
            <Input
              id="phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+7 (000) 000-00-00"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="workingHours">Часы работы</Label>
            <Input
              id="workingHours"
              value={workingHours}
              onChange={e => setWorkingHours(e.target.value)}
              placeholder="Ежедневно 10:00–21:00"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Адрес</Label>
            <Input
              id="address"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="г. Москва, ул. Пушкина, 10"
            />
          </div>
        </div>
      </section>

      {/* ── Доставка ─────────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Доставка</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="freeShippingFrom">Бесплатная доставка от (₽)</Label>
            <Input
              id="freeShippingFrom"
              type="number"
              value={freeShippingFrom}
              onChange={e => setFreeShippingFrom(e.target.value)}
              placeholder="5000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shippingCost">Стоимость доставки (₽)</Label>
            <Input
              id="shippingCost"
              type="number"
              value={shippingCost}
              onChange={e => setShippingCost(e.target.value)}
              placeholder="300"
            />
          </div>
        </div>
      </section>

      {/* ── SEO ──────────────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">SEO</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={e => setMetaTitle(e.target.value)}
              placeholder="Интернет-магазин электроники"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="metaDesc">Meta Description</Label>
            <Input
              id="metaDesc"
              value={metaDesc}
              onChange={e => setMetaDesc(e.target.value)}
              placeholder="Лучшие цены на технику..."
            />
          </div>
        </div>
      </section>

      {/* ── Социальные сети и аналитика ──────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Соцсети и аналитика</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="socialVk">ВКонтакте (URL группы)</Label>
            <Input
              id="socialVk"
              value={socialVk}
              onChange={e => setSocialVk(e.target.value)}
              placeholder="https://vk.com/myshop"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="socialTg">Telegram (ссылка или @канал)</Label>
            <Input
              id="socialTg"
              value={socialTg}
              onChange={e => setSocialTg(e.target.value)}
              placeholder="https://t.me/myshop"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="yandexMetrika">Яндекс.Метрика (ID счётчика)</Label>
            <Input
              id="yandexMetrika"
              value={yandexMetrika}
              onChange={e => setYandexMetrika(e.target.value)}
              placeholder="12345678"
            />
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
      )}

      {saved && (
        <p className="rounded-md bg-green-50 px-4 py-2.5 text-sm text-green-700 font-medium">
          ✓ Настройки сохранены
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Сохранение..." : "Сохранить настройки"}
      </Button>
    </form>
  )
}

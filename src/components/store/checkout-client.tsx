"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react"
import { useCart } from "./cart-provider"
import { formatPrice } from "@/lib/utils"

interface Store {
  id: string
  slug: string
  settings?: { freeShippingFrom?: number | null; shippingCost?: number | null } | null
}

export function CheckoutClient({ store }: { store: Store }) {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()
  const [step, setStep] = useState<"cart" | "form" | "success">("cart")
  const [loading, setLoading] = useState(false)
  const [orderNumber, setOrderNumber] = useState<number | null>(null)

  const freeFrom = store.settings?.freeShippingFrom ?? 0
  const shippingCost = store.settings?.shippingCost ?? 300
  const shipping = freeFrom > 0 && total >= freeFrom ? 0 : shippingCost
  const orderTotal = total + shipping

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    comment: "",
  })

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId: store.id,
        customerName: form.name,
        customerPhone: form.phone,
        customerEmail: form.email,
        address: form.address,
        city: form.city,
        comment: form.comment,
        subtotal: total,
        shipping,
        total: orderTotal,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setOrderNumber(data.number)
      clearCart()
      setStep("success")
    }
    setLoading(false)
  }

  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Заказ оформлен!</h1>
        <p className="text-gray-600 mb-2">Ваш заказ #{orderNumber} успешно создан.</p>
        <p className="text-gray-500 text-sm mb-8">Мы свяжемся с вами для подтверждения.</p>
        <Link
          href={`/store/${store.slug}`}
          className="inline-block bg-gray-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800"
        >
          Продолжить покупки
        </Link>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Корзина пуста</h1>
        <Link
          href={`/store/${store.slug}/catalog`}
          className="inline-block bg-gray-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800"
        >
          Перейти в каталог
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {step === "cart" ? "Корзина" : "Оформление заказа"}
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {step === "cart" ? (
            <>
              <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-4 p-4">
                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={64} height={64} className="object-cover" />
                      ) : (
                        <div className="h-full w-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm line-clamp-2">{item.name}</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="font-semibold text-gray-900 w-20 text-right text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <form id="order-form" onSubmit={handleOrder} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Иван Петров"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="ivan@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Пермь"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Адрес доставки</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="ул. Ленина, 1, кв. 10"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
                  <textarea
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Удобное время доставки, пожелания..."
                  />
                </div>
              </div>
            </form>
          )}
        </div>

        <div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4 sticky top-24">
            <h2 className="font-semibold text-gray-900">Итого</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Товары ({items.reduce((a, i) => a + i.quantity, 0)} шт.)</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Доставка</span>
                <span>{shipping === 0 ? "Бесплатно" : formatPrice(shipping)}</span>
              </div>
              {freeFrom > 0 && total < freeFrom && (
                <p className="text-xs text-gray-400">
                  До бесплатной доставки: {formatPrice(freeFrom - total)}
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900">
              <span>Итого</span>
              <span>{formatPrice(orderTotal)}</span>
            </div>

            {step === "cart" ? (
              <button
                onClick={() => setStep("form")}
                className="w-full h-11 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                Оформить заказ
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  form="order-form"
                  disabled={loading}
                  className="w-full h-11 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-60"
                >
                  {loading ? "Оформление..." : "Подтвердить заказ"}
                </button>
                <button
                  onClick={() => setStep("cart")}
                  className="w-full text-sm text-gray-500 hover:text-gray-900"
                >
                  ← Назад к корзине
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

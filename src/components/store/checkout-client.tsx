"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Trash2, Minus, Plus, ShoppingBag, Check } from "lucide-react"
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

  const freeFrom    = store.settings?.freeShippingFrom ?? 0
  const shippingCost = store.settings?.shippingCost ?? 300
  const shipping    = freeFrom > 0 && total >= freeFrom ? 0 : shippingCost
  const orderTotal  = total + shipping

  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", city: "", comment: "" })

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
          name:      i.name,
          price:     i.price,
          quantity:  i.quantity,
          image:     i.image,
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
      <div style={{ paddingTop: 80 }}>
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(0,56,255,0.08)" }}
          >
            <Check className="h-10 w-10" style={{ color: "var(--accent)" }} />
          </div>
          <h1
            className="font-black tracking-tight mb-3"
            style={{ fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-0.02em", color: "var(--text)" }}
          >
            Заказ оформлен!
          </h1>
          <p className="mb-1" style={{ color: "var(--text-2)" }}>
            Ваш заказ <strong style={{ color: "var(--text)" }}>#{orderNumber}</strong> успешно создан.
          </p>
          <p className="text-sm mb-10" style={{ color: "var(--text-3)" }}>
            Мы свяжемся с вами для подтверждения.
          </p>
          <Link href={`/store/${store.slug}`} className="btn-primary">
            Продолжить покупки
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div style={{ paddingTop: 80 }}>
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--bg-2)" }}
          >
            <ShoppingBag className="h-8 w-8" style={{ color: "var(--text-3)" }} />
          </div>
          <h1
            className="font-black tracking-tight mb-6"
            style={{ fontSize: "clamp(24px, 4vw, 36px)", letterSpacing: "-0.02em", color: "var(--text)" }}
          >
            Корзина пуста
          </h1>
          <Link href={`/store/${store.slug}/catalog`} className="btn-primary">
            Перейти в каталог
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: 72 }}>
      <div className="max-w-[1100px] mx-auto px-6 py-10">

        <h1
          className="font-black tracking-tight mb-8"
          style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.02em", color: "var(--text)" }}
        >
          {step === "cart" ? "Корзина" : "Оформление"}
        </h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Main */}
          <div className="lg:col-span-2 space-y-4">
            {step === "cart" ? (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                {items.map((item, idx) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-4 px-5 py-4"
                    style={{ borderBottom: idx < items.length - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <div
                      className="h-16 w-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: "var(--bg-2)" }}
                    >
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={64} height={64} className="object-contain p-1" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2" style={{ color: "var(--text)" }}>{item.name}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: "var(--text)" }}>{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="h-7 w-7 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: "var(--bg-2)", color: "var(--text-2)" }}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="h-7 w-7 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: "var(--bg-2)", color: "var(--text-2)" }}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="font-semibold w-20 text-right text-sm shrink-0" style={{ color: "var(--text)" }}>
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="transition-colors"
                      style={{ color: "var(--text-3)" }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <form
                id="order-form"
                onSubmit={handleOrder}
                className="rounded-2xl p-6"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { key: "name",    label: "Имя *",           required: true,  type: "text",  placeholder: "Иван Петров" },
                    { key: "phone",   label: "Телефон *",        required: true,  type: "tel",   placeholder: "+7 (999) 123-45-67" },
                    { key: "email",   label: "Email",            required: false, type: "email", placeholder: "ivan@example.com" },
                    { key: "city",    label: "Город",            required: false, type: "text",  placeholder: "Пермь" },
                  ].map(({ key, label, required, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>{label}</label>
                      <input
                        required={required}
                        type={type}
                        value={form[key as keyof typeof form]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        placeholder={placeholder}
                        className="w-full rounded-xl px-4 text-sm outline-none"
                        style={{
                          height: 40,
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Адрес доставки</label>
                    <input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="ул. Ленина, 1, кв. 10"
                      className="w-full rounded-xl px-4 text-sm outline-none"
                      style={{ height: 40, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-2)" }}>Комментарий</label>
                    <textarea
                      value={form.comment}
                      onChange={(e) => setForm({ ...form, comment: e.target.value })}
                      rows={3}
                      placeholder="Удобное время доставки, пожелания..."
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                    />
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Summary */}
          <div>
            <div
              className="rounded-2xl p-5 space-y-4 sticky top-20"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <h2 className="font-bold" style={{ color: "var(--text)", fontSize: 16 }}>Итого</h2>

              <div className="space-y-2.5">
                <div className="flex justify-between text-sm" style={{ color: "var(--text-2)" }}>
                  <span>Товары ({items.reduce((a, i) => a + i.quantity, 0)} шт.)</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm" style={{ color: "var(--text-2)" }}>
                  <span>Доставка</span>
                  <span>{shipping === 0 ? "Бесплатно" : formatPrice(shipping)}</span>
                </div>
                {freeFrom > 0 && total < freeFrom && (
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>
                    До бесплатной доставки: {formatPrice(freeFrom - total)}
                  </p>
                )}
              </div>

              <div
                className="pt-3 flex justify-between font-bold"
                style={{ borderTop: "1px solid var(--border)", color: "var(--text)", fontSize: 17 }}
              >
                <span>Итого</span>
                <span>{formatPrice(orderTotal)}</span>
              </div>

              {step === "cart" ? (
                <button
                  onClick={() => setStep("form")}
                  className="btn-primary w-full justify-center"
                  style={{ height: 48 }}
                >
                  Оформить заказ
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    form="order-form"
                    disabled={loading}
                    className="btn-primary w-full justify-center disabled:opacity-60"
                    style={{ height: 48 }}
                  >
                    {loading ? "Оформление..." : "Подтвердить заказ"}
                  </button>
                  <button
                    onClick={() => setStep("cart")}
                    className="w-full text-sm transition-colors"
                    style={{ color: "var(--text-3)" }}
                  >
                    ← Назад к корзине
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

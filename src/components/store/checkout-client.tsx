"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Trash2, Minus, Plus, ShoppingBag, Check } from "lucide-react"
import { useCart } from "./cart-provider"
import { formatPrice } from "@/lib/utils"

interface Store {
  id: string; slug: string
  settings?: { freeShippingFrom?: number | null; shippingCost?: number | null } | null
}

export function CheckoutClient({ store }: { store: Store }) {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()
  const [step, setStep]       = useState<"cart" | "form" | "success">("cart")
  const [loading, setLoading] = useState(false)
  const [orderNumber, setOrderNumber] = useState<number | null>(null)

  const freeFrom     = store.settings?.freeShippingFrom ?? 0
  const shippingCost = store.settings?.shippingCost ?? 300
  const shipping     = freeFrom > 0 && total >= freeFrom ? 0 : shippingCost
  const orderTotal   = total + shipping

  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", city: "", comment: "" })

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId: store.id, customerName: form.name, customerPhone: form.phone,
        customerEmail: form.email, address: form.address, city: form.city,
        comment: form.comment, subtotal: total, shipping, total: orderTotal,
        items: items.map(i => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
      }),
    })
    if (res.ok) { const data = await res.json(); setOrderNumber(data.number); clearCart(); setStep("success") }
    setLoading(false)
  }

  if (step === "success") {
    return (
      <div style={{ paddingTop: 60, background: "#000", minHeight: "100svh" }}>
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
            style={{ background: "rgba(0,204,255,0.10)", border: "1px solid rgba(0,204,255,0.25)" }}
          >
            <Check className="h-10 w-10" style={{ color: "var(--accent)" }} />
          </div>
          <h1 style={{ fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16 }}>
            Заказ оформлен!
          </h1>
          <p style={{ color: "var(--text-2)", marginBottom: 6 }}>
            Ваш заказ <strong style={{ color: "#fff" }}>#{orderNumber}</strong> успешно создан.
          </p>
          <p style={{ fontSize: 14, color: "var(--text-3)", marginBottom: 40 }}>
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
      <div style={{ paddingTop: 60, background: "#000", minHeight: "100svh" }}>
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <ShoppingBag className="h-8 w-8" style={{ color: "var(--text-3)" }} />
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#fff", marginBottom: 32 }}>
            Корзина пуста
          </h1>
          <Link href={`/store/${store.slug}/catalog`} className="btn-primary">
            В каталог
          </Link>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: 44,
    background: "#0A0A0A",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 12,
    padding: "0 16px",
    fontSize: 14,
    color: "#fff",
    outline: "none",
  }

  return (
    <div style={{ paddingTop: 60, background: "#000", minHeight: "100svh" }}>
      <div className="max-w-[1100px] mx-auto px-6 py-10">

        <h1 style={{ fontSize: "clamp(32px, 6vw, 64px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.88, color: "#fff", marginBottom: 40 }}>
          {step === "cart" ? "Корзина" : "Оформление"}
        </h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Main */}
          <div className="lg:col-span-2 space-y-4">
            {step === "cart" ? (
              <div className="rounded-2xl overflow-hidden" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}>
                {items.map((item, idx) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-4 px-5 py-4"
                    style={{ borderBottom: idx < items.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}
                  >
                    <div
                      className="h-16 w-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: "#0A0A0A" }}
                    >
                      {item.image && <Image src={item.image} alt={item.name} width={64} height={64} className="object-contain p-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2" style={{ color: "rgba(255,255,255,0.80)" }}>{item.name}</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", marginTop: 2 }}>{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="h-7 w-7 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-2)" }}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold" style={{ color: "#fff" }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="h-7 w-7 rounded-full flex items-center justify-center transition-colors"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-2)" }}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="font-semibold w-20 text-right text-sm shrink-0" style={{ color: "#fff" }}>
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    <button onClick={() => removeItem(item.productId)} style={{ color: "var(--text-3)", background: "none", border: "none", cursor: "pointer" }}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <form id="order-form" onSubmit={handleOrder} className="rounded-2xl p-6 space-y-4" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { key: "name",  label: "Имя *",      req: true,  type: "text",  ph: "Иван Петров" },
                    { key: "phone", label: "Телефон *",   req: true,  type: "tel",   ph: "+7 (999) 123-45-67" },
                    { key: "email", label: "Email",       req: false, type: "email", ph: "ivan@example.com" },
                    { key: "city",  label: "Город",       req: false, type: "text",  ph: "Пермь" },
                  ].map(({ key, label, req, type, ph }) => (
                    <div key={key}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-3)", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
                        {label}
                      </label>
                      <input
                        required={req} type={type}
                        value={form[key as keyof typeof form]}
                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                        placeholder={ph}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-3)", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
                      Адрес доставки
                    </label>
                    <input
                      value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                      placeholder="ул. Ленина, 1, кв. 10"
                      style={inputStyle}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-3)", marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
                      Комментарий
                    </label>
                    <textarea
                      value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })}
                      rows={3} placeholder="Удобное время доставки, пожелания..."
                      style={{ ...inputStyle, height: "auto", padding: "12px 16px", resize: "none" as const }}
                    />
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Summary */}
          <div>
            <div className="rounded-2xl p-5 space-y-4 sticky top-20" style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Итого</h2>

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
                  <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                    До бесплатной: {formatPrice(freeFrom - total)}
                  </p>
                )}
              </div>

              <div className="pt-3 flex justify-between font-bold" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 18 }}>
                <span>Итого</span>
                <span style={{ color: "var(--accent)" }}>{formatPrice(orderTotal)}</span>
              </div>

              {step === "cart" ? (
                <button onClick={() => setStep("form")} className="btn-primary w-full justify-center" style={{ height: 48 }}>
                  Оформить заказ
                </button>
              ) : (
                <>
                  <button
                    type="submit" form="order-form" disabled={loading}
                    className="btn-primary w-full justify-center disabled:opacity-60"
                    style={{ height: 48 }}
                  >
                    {loading ? "Оформление..." : "Подтвердить"}
                  </button>
                  <button onClick={() => setStep("cart")} style={{ width: "100%", fontSize: 13, color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>
                    ← Назад
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

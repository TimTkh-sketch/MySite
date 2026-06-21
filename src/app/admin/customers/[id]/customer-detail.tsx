"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Edit2, Save, X, Plus, Minus, Send } from "lucide-react"
import { cn } from "@/lib/utils"

const TIER_BADGE: Record<string, string> = {
  black: "tier-badge tier-black", silver: "tier-badge tier-silver", gold: "tier-badge tier-gold",
}
const TIER_LABELS = { black: "BLACK", silver: "SILVER", gold: "GOLD" }
const TX_LABELS: Record<string, string> = {
  earn: "Начисление", spend: "Списание", birthday: "День рождения", admin: "Корректировка",
}
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600", CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-amber-100 text-amber-700", SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-emerald-100 text-emerald-700", CANCELLED: "bg-red-100 text-red-600",
}

interface Props {
  customer: {
    id: string; firstName: string; lastName: string; middleName: string | null
    email: string; phone: string | null; birthDate: Date | null; gender: string | null
    bonusCard: { cardNumber: string; balance: number; totalEarned: number; tier: string } | null
    bonusHistory: { id: string; type: string; amount: number; description: string; createdAt: Date }[]
    notifications: { id: string; title: string; message: string; type: string; sentAt: Date; isRead: boolean }[]
  }
  orders: {
    id: string; number: number; status: string; total: number; createdAt: Date
    items: { id: string; name: string; quantity: number; price: number }[]
  }[]
}

export function CustomerDetail({ customer: init, orders }: Props) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    firstName: init.firstName, lastName: init.lastName,
    middleName: init.middleName ?? "", phone: init.phone ?? "",
    gender: init.gender ?? "",
    birthDate: init.birthDate ? new Date(init.birthDate).toISOString().slice(0, 10) : "",
  })
  const [saving, setSaving] = useState(false)

  // Bonus form
  const [bonusAmt, setBonusAmt] = useState("")
  const [bonusDesc, setBonusDesc] = useState("")
  const [bonusMode, setBonusMode] = useState<"add" | "sub">("add")
  const [bonusLoading, setBonusLoading] = useState(false)
  const [card, setCard] = useState(init.bonusCard)
  const [history, setHistory] = useState(init.bonusHistory)

  // Notify form
  const [notifTitle, setNotifTitle] = useState("")
  const [notifMsg, setNotifMsg] = useState("")
  const [notifSent, setNotifSent] = useState(false)

  async function saveProfile() {
    setSaving(true)
    await fetch(`/api/admin/customers/${init.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, birthDate: form.birthDate || null }),
    })
    setSaving(false); setEditing(false)
  }

  async function applyBonus() {
    if (!bonusAmt || !bonusDesc) return
    setBonusLoading(true)
    const amount = bonusMode === "sub" ? -Math.abs(Number(bonusAmt)) : Math.abs(Number(bonusAmt))
    const r = await fetch(`/api/admin/customers/${init.id}/bonus`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, description: bonusDesc, type: "admin" }),
    })
    const updated = await r.json()
    setCard(updated)
    // refresh history
    const h = await fetch(`/api/admin/customers/${init.id}`)
    const d = await h.json()
    setHistory(d.bonusHistory ?? [])
    setBonusAmt(""); setBonusDesc(""); setBonusLoading(false)
  }

  async function sendNotif() {
    if (!notifTitle || !notifMsg) return
    await fetch("/api/admin/customers/notify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerIds: [init.id], title: notifTitle, message: notifMsg }),
    })
    setNotifSent(true); setNotifTitle(""); setNotifMsg("")
    setTimeout(() => setNotifSent(false), 2000)
  }

  const inp = "w-full text-sm px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#F26522] transition-colors"

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/customers" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Клиенты
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-900">{init.firstName} {init.lastName}</h1>

      {/* Block 1: Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Личные данные</h2>
          <button onClick={() => setEditing(p => !p)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors">
            {editing ? <><X className="h-3.5 w-3.5" />Отмена</> : <><Edit2 className="h-3.5 w-3.5" />Редактировать</>}
          </button>
        </div>
        {editing ? (
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "Имя", k: "firstName" as const }, { l: "Фамилия", k: "lastName" as const },
              { l: "Отчество", k: "middleName" as const }, { l: "Телефон", k: "phone" as const },
              { l: "Дата рождения", k: "birthDate" as const, type: "date" },
            ].map(({ l, k, type }) => (
              <div key={k}>
                <label className="block text-xs text-gray-500 mb-1">{l}</label>
                <input type={type ?? "text"} className={inp} value={form[k]}
                  onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Пол</label>
              <select className={inp} value={form.gender}
                onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                <option value="">—</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>
            <div className="col-span-2">
              <button onClick={saveProfile} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F26522] text-white text-sm font-medium hover:bg-[#d94f00] transition-colors disabled:opacity-60">
                <Save className="h-3.5 w-3.5" />
                {saving ? "Сохраняю..." : "Сохранить"}
              </button>
            </div>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["ФИО", `${init.firstName} ${init.middleName ?? ""} ${init.lastName}`.trim()],
              ["Email", init.email],
              ["Телефон", init.phone ?? "—"],
              ["Дата рождения", init.birthDate ? new Date(init.birthDate).toLocaleDateString("ru-RU") : "—"],
              ["Пол", init.gender === "male" ? "Мужской" : init.gender === "female" ? "Женский" : "—"],
            ].map(([label, val]) => (
              <div key={label}>
                <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
                <dd className="font-medium text-gray-900">{val}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Block 2: Bonus card */}
      {card && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Бонусная карта</h2>
          <div className="flex items-start gap-6 flex-wrap">
            <dl className="grid grid-cols-2 gap-3 text-sm flex-1">
              {[
                ["Номер", card.cardNumber],
                ["Уровень", <span key="t" className={TIER_BADGE[card.tier] ?? ""}>{TIER_LABELS[card.tier as keyof typeof TIER_LABELS]}</span>],
                ["Баланс", `${card.balance.toLocaleString("ru")} ₽`],
                ["Всего накоплено", `${card.totalEarned.toLocaleString("ru")} ₽`],
              ].map(([l, v]) => (
                <div key={String(l)}>
                  <dt className="text-xs text-gray-400 mb-0.5">{l}</dt>
                  <dd className="font-medium text-gray-900">{v}</dd>
                </div>
              ))}
            </dl>
            {/* Manual bonus */}
            <div className="min-w-64 space-y-3 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Начислить / списать</p>
              <div className="flex gap-2">
                {[["add", "Начислить", <Plus key="p" className="h-3.5 w-3.5" />], ["sub", "Списать", <Minus key="m" className="h-3.5 w-3.5" />]].map(([mode, label, icon]) => (
                  <button key={String(mode)} onClick={() => setBonusMode(mode as "add" | "sub")}
                    className={cn("flex items-center gap-1 flex-1 justify-center py-1.5 rounded-lg text-xs font-medium transition-colors",
                      bonusMode === mode ? "bg-[#F26522] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                    {icon}{label}
                  </button>
                ))}
              </div>
              <input placeholder="Сумма баллов" value={bonusAmt} onChange={e => setBonusAmt(e.target.value)}
                className={inp} type="number" min="1" />
              <input placeholder="Причина" value={bonusDesc} onChange={e => setBonusDesc(e.target.value)} className={inp} />
              <button onClick={applyBonus} disabled={bonusLoading || !bonusAmt || !bonusDesc}
                className="w-full py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
                {bonusLoading ? "..." : "Применить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block 3: Transaction history */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">История транзакций</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Дата", "Тип", "Описание", "Сумма"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(tx => (
                <tr key={tx.id} className="border-b border-gray-50">
                  <td className="px-3 py-2 text-gray-400 whitespace-nowrap text-xs">
                    {new Date(tx.createdAt).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-3 py-2 text-gray-600">{TX_LABELS[tx.type] ?? tx.type}</td>
                  <td className="px-3 py-2 text-gray-700">{tx.description}</td>
                  <td className="px-3 py-2">
                    <span className={cn("font-bold", tx.amount > 0 ? "text-emerald-600" : "text-red-500")}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("ru")}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400 text-xs">Нет операций</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block 4: Orders */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Заказы ({orders.length})
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400">Заказов нет</p>
        ) : (
          <div className="space-y-2">
            {orders.map(o => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                <div>
                  <span className="font-medium">#{o.number}</span>
                  <span className="text-gray-400 ml-2">{new Date(o.createdAt).toLocaleDateString("ru-RU")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600")}>
                    {o.status}
                  </span>
                  <span className="font-bold text-gray-900">{o.total.toLocaleString("ru")} ₽</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Block 5: Send notification */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Отправить уведомление</h2>
        <div className="space-y-3 max-w-md">
          <input placeholder="Заголовок" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className={inp} />
          <textarea placeholder="Текст сообщения" value={notifMsg} onChange={e => setNotifMsg(e.target.value)}
            rows={3} className={inp + " resize-none"} />
          <button onClick={sendNotif} disabled={!notifTitle || !notifMsg}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: notifSent ? "#16a34a" : "#1a1a1a" }}>
            <Send className="h-3.5 w-3.5" />
            {notifSent ? "Отправлено!" : "Отправить"}
          </button>
        </div>
      </div>
    </div>
  )
}

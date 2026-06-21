"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, Filter, Users, Gift } from "lucide-react"
import { cn } from "@/lib/utils"

interface Customer {
  id: string; firstName: string; lastName: string; email: string; phone: string | null
  createdAt: string; birthDate: string | null
  bonusCard: { cardNumber: string; balance: number; tier: string } | null
}

const TIER_BADGE: Record<string, string> = {
  black:  "tier-badge tier-black",
  silver: "tier-badge tier-silver",
  gold:   "tier-badge tier-gold",
}
const TIER_LABELS = { black: "BLACK", silver: "SILVER", gold: "GOLD" }

export function CustomersTable() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal]         = useState(0)
  const [q, setQ]                 = useState("")
  const [tier, setTier]           = useState("")
  const [bday, setBday]           = useState("")
  const [sort, setSort]           = useState("createdAt")
  const [page, setPage]           = useState(1)
  const [selected, setSelected]   = useState<string[]>([])
  const [loading, setLoading]     = useState(true)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ q, tier, bday, sort, page: String(page) })
    const r = await fetch(`/api/admin/customers?${p}`)
    const d = await r.json()
    setCustomers(d.customers ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }, [q, tier, bday, sort, page])

  useEffect(() => { fetch_() }, [fetch_])

  async function bulkBonus() {
    const amt = prompt("Начислить баллы (введите число):")
    if (!amt || isNaN(Number(amt))) return
    const desc = prompt("Причина:") ?? "Ручное начисление"
    await Promise.all(selected.map(id =>
      fetch(`/api/admin/customers/${id}/bonus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amt), description: desc, type: "admin" }),
      })
    ))
    setSelected([])
    fetch_()
  }

  async function bulkNotify() {
    const title = prompt("Заголовок уведомления:")
    if (!title) return
    const message = prompt("Текст:") ?? ""
    await fetch("/api/admin/customers/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerIds: selected, title, message }),
    })
    setSelected([])
    alert("Уведомления отправлены!")
  }

  const toggleSelect = (id: string) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <input placeholder="Поиск по имени, email, телефону, карте..."
            value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
            className="flex-1 text-sm outline-none placeholder-gray-400" />
        </div>
        <select value={tier} onChange={e => { setTier(e.target.value); setPage(1) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none">
          <option value="">Все уровни</option>
          <option value="black">BLACK</option>
          <option value="silver">SILVER</option>
          <option value="gold">GOLD</option>
        </select>
        <select value={bday} onChange={e => { setBday(e.target.value); setPage(1) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none">
          <option value="">Все ДР</option>
          <option value="today">Сегодня ДР</option>
          <option value="month">В этом месяце</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none">
          <option value="createdAt">По дате</option>
          <option value="balance">По баллам</option>
        </select>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Users className="h-3.5 w-3.5" />
          {total} клиентов
        </div>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="bg-[#fff3ee] border border-[#F26522]/20 rounded-xl p-3 flex items-center gap-3">
          <span className="text-sm font-medium text-[#F26522]">Выбрано: {selected.length}</span>
          <button onClick={bulkBonus} className="text-xs px-3 py-1.5 bg-[#F26522] text-white rounded-lg hover:bg-[#d94f00] transition-colors">
            Начислить баллы
          </button>
          <button onClick={bulkNotify} className="text-xs px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Отправить уведомление
          </button>
          <button onClick={() => setSelected([])} className="text-xs text-gray-400 hover:text-gray-700 ml-auto">Сбросить</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Загрузка...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Клиентов не найдено</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 w-8">
                  <input type="checkbox"
                    checked={selected.length === customers.length}
                    onChange={e => setSelected(e.target.checked ? customers.map(c => c.id) : [])}
                    className="accent-[#F26522]" />
                </th>
                {["Клиент", "Email", "Телефон", "Карта", "Баланс", "Уровень", "Дата", ""].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(c.id)}
                      onChange={() => toggleSelect(c.id)} className="accent-[#F26522]" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#F26522]/10 flex items-center justify-center text-[#F26522] font-bold text-xs shrink-0">
                        {c.firstName[0]}{c.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{c.firstName} {c.lastName}</p>
                        {c.birthDate && new Date(c.birthDate).getMonth() + 1 === new Date().getMonth() + 1 &&
                          new Date(c.birthDate).getDate() === new Date().getDate() && (
                          <span className="text-[10px] text-[#F26522]">🎂 Сегодня ДР!</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{c.bonusCard?.cardNumber ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {(c.bonusCard?.balance ?? 0).toLocaleString("ru")}
                  </td>
                  <td className="px-4 py-3">
                    {c.bonusCard && (
                      <span className={TIER_BADGE[c.bonusCard.tier] ?? "tier-badge tier-black"}>
                        {TIER_LABELS[c.bonusCard.tier as keyof typeof TIER_LABELS] ?? c.bonusCard.tier}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${c.id}`}
                      className="text-xs text-blue-600 hover:underline font-medium">
                      Открыть
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.ceil(total / 20) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={cn("w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                page === p ? "bg-[#F26522] text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200")}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Search, Users, ChevronDown, ChevronUp, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Customer {
  id: string; firstName: string; lastName: string; email: string; phone: string | null
  createdAt: string; birthDate: string | null; gender: string | null
  bonusCard: { cardNumber: string; balance: number; tier: string; totalEarned: number; totalSpent: number } | null
}

const TIER_BADGE: Record<string, string> = {
  black:  "tier-badge tier-black",
  silver: "tier-badge tier-silver",
  gold:   "tier-badge tier-gold",
}
const TIER_LABELS = { black: "BLACK", silver: "SILVER", gold: "GOLD" }

const defaultFilters = {
  q:          "",
  tier:       "",
  gender:     "",
  bday:       "",
  balanceMin: "",
  balanceMax: "",
  regFrom:    "",
  regTo:      "",
  inactive:   "",
  sort:       "createdAt",
}

type Filters = typeof defaultFilters

export function CustomersTable() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal]         = useState(0)
  const [filters, setFilters]     = useState<Filters>(defaultFilters)
  const [page, setPage]           = useState(1)
  const [selected, setSelected]   = useState<string[]>([])
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState(false)

  const set = (k: keyof Filters, v: string) => {
    setFilters(f => ({ ...f, [k]: v }))
    setPage(1)
  }

  const activeCount = Object.entries(filters).filter(
    ([k, v]) => k !== "sort" && v !== ""
  ).length

  const fetch_ = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ ...filters, page: String(page) })
    const r = await fetch(`/api/admin/customers?${p}`)
    const d = await r.json()
    setCustomers(d.customers ?? [])
    setTotal(d.total ?? 0)
    setLoading(false)
  }, [filters, page])

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
    setSelected([]); fetch_()
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

      {/* ── ФИЛЬТРЫ ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* Строка 1: поиск + сортировка + кнопка расширения */}
        <div className="flex flex-wrap gap-3 items-center p-4">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              placeholder="Поиск по имени, email, телефону, карте…"
              value={filters.q}
              onChange={e => set("q", e.target.value)}
              className="flex-1 text-sm outline-none placeholder-gray-400"
            />
            {filters.q && (
              <button onClick={() => set("q", "")} className="text-gray-300 hover:text-gray-500">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select value={filters.sort} onChange={e => set("sort", e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none">
            <option value="createdAt">По дате регистрации</option>
            <option value="balance">По балансу ↓</option>
            <option value="totalEarned">По заработанным ↓</option>
            <option value="lastName">По алфавиту</option>
          </select>

          <button
            onClick={() => setExpanded(e => !e)}
            className={cn(
              "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors",
              expanded || activeCount > 0
                ? "bg-[#F26522] text-white border-[#F26522]"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Фильтры
            {activeCount > 0 && (
              <span className="bg-white text-[#F26522] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
            <Users className="h-3.5 w-3.5" />
            {total} клиентов
          </div>
        </div>

        {/* Строка 2: расширенные фильтры */}
        {expanded && (
          <div className="border-t border-gray-100 p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

            {/* Уровень */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Уровень</label>
              <select value={filters.tier} onChange={e => set("tier", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none">
                <option value="">Все</option>
                <option value="black">BLACK</option>
                <option value="silver">SILVER</option>
                <option value="gold">GOLD</option>
              </select>
            </div>

            {/* Пол */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Пол</label>
              <select value={filters.gender} onChange={e => set("gender", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none">
                <option value="">Все</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>

            {/* День рождения */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">День рождения</label>
              <select value={filters.bday} onChange={e => set("bday", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none">
                <option value="">Любой</option>
                <option value="today">Сегодня 🎂</option>
                <option value="month">В этом месяце</option>
              </select>
            </div>

            {/* Сгорание баллов */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                Сгорание баллов
              </label>
              <select value={filters.inactive} onChange={e => set("inactive", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none">
                <option value="">Все</option>
                <option value="30">Нет активности 30+ дней</option>
                <option value="60">Нет активности 60+ дней</option>
                <option value="90">Нет активности 90+ дней</option>
                <option value="180">Нет активности 180+ дней</option>
              </select>
            </div>

            {/* Баланс — от */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Баллы от</label>
              <input
                type="number" min={0} placeholder="0"
                value={filters.balanceMin}
                onChange={e => set("balanceMin", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none"
              />
            </div>

            {/* Баланс — до */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Баллы до</label>
              <input
                type="number" min={0} placeholder="∞"
                value={filters.balanceMax}
                onChange={e => set("balanceMax", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none"
              />
            </div>

            {/* Регистрация с */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Регистрация с</label>
              <input
                type="date"
                value={filters.regFrom}
                onChange={e => set("regFrom", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none"
              />
            </div>

            {/* Регистрация по */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">Регистрация по</label>
              <input
                type="date"
                value={filters.regTo}
                onChange={e => set("regTo", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none"
              />
            </div>

            {/* Сброс */}
            {activeCount > 0 && (
              <div className="col-span-full flex justify-end">
                <button
                  onClick={() => { setFilters(defaultFilters); setPage(1) }}
                  className="text-xs text-[#F26522] hover:underline"
                >
                  Сбросить все фильтры
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── МАССОВЫЕ ДЕЙСТВИЯ ───────────────────────────────── */}
      {selected.length > 0 && (
        <div className="bg-[#fff3ee] border border-[#F26522]/20 rounded-xl p-3 flex items-center gap-3">
          <span className="text-sm font-medium text-[#F26522]">Выбрано: {selected.length}</span>
          <button onClick={bulkBonus}
            className="text-xs px-3 py-1.5 bg-[#F26522] text-white rounded-lg hover:bg-[#d94f00] transition-colors">
            Начислить баллы
          </button>
          <button onClick={bulkNotify}
            className="text-xs px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Уведомление
          </button>
          <button onClick={() => setSelected([])} className="text-xs text-gray-400 hover:text-gray-700 ml-auto">
            Сбросить
          </button>
        </div>
      )}

      {/* ── ТАБЛИЦА ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Загрузка…</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Клиентов не найдено</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox"
                      checked={selected.length === customers.length}
                      onChange={e => setSelected(e.target.checked ? customers.map(c => c.id) : [])}
                      className="accent-[#F26522]" />
                  </th>
                  {["Клиент", "Контакт", "Карта", "Баланс", "Заработано", "Потрачено", "Уровень", "Пол", "Регистрация", ""].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map(c => {
                  const isToday = c.birthDate &&
                    new Date(c.birthDate).getMonth() + 1 === new Date().getMonth() + 1 &&
                    new Date(c.birthDate).getDate() === new Date().getDate()
                  return (
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
                            <p className="font-medium text-gray-900 whitespace-nowrap">{c.firstName} {c.lastName}</p>
                            {isToday && <span className="text-[10px] text-[#F26522]">🎂 Сегодня ДР!</span>}
                            {c.birthDate && !isToday && (
                              <p className="text-[11px] text-gray-400">
                                {new Date(c.birthDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{c.email}</p>
                        {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                        {c.bonusCard?.cardNumber ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                        {(c.bonusCard?.balance ?? 0).toLocaleString("ru")}
                        <span className="text-xs font-normal text-gray-400 ml-1">₽</span>
                      </td>
                      <td className="px-4 py-3 text-green-600 whitespace-nowrap">
                        +{(c.bonusCard?.totalEarned ?? 0).toLocaleString("ru")}
                      </td>
                      <td className="px-4 py-3 text-orange-500 whitespace-nowrap">
                        −{(c.bonusCard?.totalSpent ?? 0).toLocaleString("ru")}
                      </td>
                      <td className="px-4 py-3">
                        {c.bonusCard ? (
                          <span className={TIER_BADGE[c.bonusCard.tier] ?? "tier-badge tier-black"}>
                            {TIER_LABELS[c.bonusCard.tier as keyof typeof TIER_LABELS] ?? c.bonusCard.tier}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {c.gender === "male" ? "М" : c.gender === "female" ? "Ж" : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/customers/${c.id}`}
                          className="text-xs text-blue-600 hover:underline font-medium">
                          Открыть
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ПАГИНАЦИЯ ───────────────────────────────────────── */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.ceil(total / 20) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={cn("w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                page === p
                  ? "bg-[#F26522] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200")}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

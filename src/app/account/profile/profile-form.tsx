"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Save, Eye, EyeOff } from "lucide-react"

interface Customer {
  firstName: string; lastName: string; middleName: string | null
  email: string; phone: string | null; birthDate: Date | null; gender: string | null
}

export function ProfileForm({ customer }: { customer: Customer }) {
  const router = useRouter()
  const [form, setForm] = useState({
    firstName:  customer.firstName,
    lastName:   customer.lastName,
    middleName: customer.middleName ?? "",
    phone:      customer.phone ?? "",
    birthDate:  customer.birthDate ? new Date(customer.birthDate).toISOString().slice(0, 10) : "",
    gender:     customer.gender ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [err,    setErr]    = useState("")

  // Password change
  const [oldPw, setOldPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwErr, setPwErr] = useState("")
  const [pwSaved, setPwSaved] = useState(false)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setErr("")
    const r = await fetch("/api/customer/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); router.refresh() }
    else { const d = await r.json(); setErr(d.error ?? "Ошибка") }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwErr("")
    if (newPw.length < 6) { setPwErr("Минимум 6 символов"); return }
    const r = await fetch("/api/customer/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
    })
    if (r.ok) { setPwSaved(true); setOldPw(""); setNewPw(""); setTimeout(() => setPwSaved(false), 2000) }
    else { const d = await r.json(); setPwErr(d.error ?? "Ошибка") }
  }

  const input = "w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#F26522] transition-colors bg-white"

  return (
    <div className="space-y-6">
      {/* Profile form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">Личные данные</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Имя *", key: "firstName" as const },
              { label: "Фамилия *", key: "lastName" as const },
              { label: "Отчество", key: "middleName" as const },
              { label: "Телефон", key: "phone" as const },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input className={input} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Дата рождения</label>
              <input type="date" className={input} value={form.birthDate}
                onChange={e => setForm(p => ({ ...p, birthDate: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Пол</label>
              <select className={input} value={form.gender}
                onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                <option value="">Не указан</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
                <option value="other">Другой</option>
              </select>
            </div>
          </div>
          {err && <p className="text-sm text-red-500">{err}</p>}
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ background: saved ? "#16a34a" : "#F26522" }}>
            <Save className="h-4 w-4" />
            {saved ? "Сохранено!" : saving ? "Сохраняю..." : "Сохранить изменения"}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">Смена пароля</h2>
        <form onSubmit={changePassword} className="space-y-4 max-w-sm">
          {[
            { label: "Текущий пароль", val: oldPw, set: setOldPw, show: showOld, toggle: () => setShowOld(p => !p) },
            { label: "Новый пароль",   val: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew(p => !p) },
          ].map(({ label, val, set, show, toggle }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <div className="relative">
                <input type={show ? "text" : "password"} className={input + " pr-10"}
                  value={val} onChange={e => set(e.target.value)} />
                <button type="button" onClick={toggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
          {pwErr && <p className="text-sm text-red-500">{pwErr}</p>}
          <button type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: pwSaved ? "#16a34a" : "#1a1a1a" }}>
            {pwSaved ? "Пароль изменён!" : "Изменить пароль"}
          </button>
        </form>
      </div>
    </div>
  )
}

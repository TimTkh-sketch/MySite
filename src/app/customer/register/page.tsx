"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, CheckCircle2, Gift } from "lucide-react"
import Link from "next/link"

const FIELDS = [
  { key: "firstName",  label: "Имя *",           type: "text",     required: true  },
  { key: "lastName",   label: "Фамилия *",        type: "text",     required: true  },
  { key: "middleName", label: "Отчество",         type: "text",     required: false },
  { key: "email",      label: "Email *",          type: "email",    required: true  },
  { key: "phone",      label: "Телефон",          type: "tel",      required: false },
  { key: "birthDate",  label: "Дата рождения",    type: "date",     required: false },
]

export default function CustomerRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    firstName: "", lastName: "", middleName: "", email: "",
    phone: "", password: "", confirm: "", birthDate: "", gender: "",
  })
  const [showPw, setShowPw]   = useState(false)
  const [agreed, setAgreed]   = useState(false)
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { setError("Пароли не совпадают"); return }
    if (form.password.length < 6) { setError("Пароль: минимум 6 символов"); return }
    if (!agreed) { setError("Необходимо согласие на обработку данных"); return }
    setLoading(true); setError("")

    const r = await fetch("/api/customer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName, lastName: form.lastName, middleName: form.middleName || null,
        email: form.email, phone: form.phone || null, password: form.password,
        birthDate: form.birthDate || null, gender: form.gender || null,
      }),
    })
    const data = await r.json()
    if (r.ok) {
      setSuccess(data.cardNumber)
      setTimeout(() => { router.push("/account"); router.refresh() }, 2500)
    } else {
      setError(data.error ?? "Ошибка регистрации")
      setLoading(false)
    }
  }

  const inp = "w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#F26522] transition-colors"

  if (success) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center max-w-sm w-full"
        >
          <div className="w-16 h-16 bg-[#fff3ee] rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-[#F26522]" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Добро пожаловать!</h2>
          <p className="text-gray-500 text-sm mb-4">
            Вам начислено <strong className="text-[#F26522]">500 приветственных баллов</strong> на любую покупку
          </p>
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-center mb-4">
            <p className="text-xs text-gray-400 mb-1">Номер вашей карты</p>
            <p className="font-black text-gray-900 text-lg tracking-widest">{success}</p>
          </div>
          <p className="text-xs text-gray-400">Переход в кабинет...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="text-center mb-8">
            <p className="text-2xl font-black text-gray-900 tracking-tight">
              GM<span className="text-[#F26522] font-light">°</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">Создайте аккаунт и получите бонусную карту</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {FIELDS.slice(0, 3).map(({ key, label, type, required }, i) => (
                <motion.div
                  key={key}
                  className={key === "middleName" ? "col-span-2" : ""}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <input type={type} required={required} className={inp}
                    value={form[key as keyof typeof form]}
                    onChange={set(key as keyof typeof form)} />
                </motion.div>
              ))}
            </div>

            {FIELDS.slice(3).map(({ key, label, type, required }, i) => (
              <motion.div key={key} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (i + 3) * 0.05 }}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input type={type} required={required} className={inp}
                  value={form[key as keyof typeof form]}
                  onChange={set(key as keyof typeof form)} />
              </motion.div>
            ))}

            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
              <label className="block text-xs font-medium text-gray-500 mb-1">Пол</label>
              <select className={inp} value={form.gender} onChange={set("gender")}>
                <option value="">Не указан</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
                <option value="other">Другой</option>
              </select>
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "password" as const, label: "Пароль *" },
                { key: "confirm"  as const, label: "Повтор пароля *" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} required className={inp + " pr-9"}
                      value={form[key]} onChange={set(key)} />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" className="mt-0.5 shrink-0 accent-[#F26522]"
                checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <span className="text-xs text-gray-500">
                Согласен(на) на{" "}
                <span className="text-[#F26522] hover:underline cursor-pointer">обработку персональных данных</span>
              </span>
            </label>

            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "#F26522" }}>
              {loading ? "Создаём аккаунт..." : "Зарегистрироваться и получить карту"}
            </motion.button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-400">
            Уже есть аккаунт?{" "}
            <Link href="/customer/login" className="text-[#F26522] font-medium hover:underline">Войти</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

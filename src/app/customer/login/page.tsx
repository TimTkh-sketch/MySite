"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function CustomerLoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    const r = await fetch("/api/customer/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (r.ok) {
      router.push("/account")
      router.refresh()
    } else {
      const d = await r.json()
      setError(d.error ?? "Ошибка входа")
      setLoading(false)
    }
  }

  const inp = "w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#F26522] transition-colors"

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-sm"
      >
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <div className="text-center mb-8">
            <p className="text-2xl font-black text-gray-900 tracking-tight">
              GM<span className="text-[#F26522] font-light">°</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">Войдите в личный кабинет</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0 }}>
              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required className={inp} />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.07 }}>
              <label className="block text-xs font-medium text-gray-500 mb-1">Пароль</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} required
                  className={inp + " pr-10"} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "#F26522" }}>
              {loading ? "Входим..." : "Войти"}
            </motion.button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-400">
            Нет аккаунта?{" "}
            <Link href="/customer/register" className="text-[#F26522] font-medium hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

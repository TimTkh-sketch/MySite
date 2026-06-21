"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Gift, X, Sparkles } from "lucide-react"
import Link from "next/link"

export function PromoPopup() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Show only if not logged in and not dismissed this session
    if (sessionStorage.getItem("promo_dismissed")) return
    fetch("/api/customer/me").then(r => {
      if (!r.ok) {
        const t = setTimeout(() => setShow(true), 2500)
        return () => clearTimeout(t)
      }
    })
  }, [])

  function dismiss() {
    sessionStorage.setItem("promo_dismissed", "1")
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.93 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="fixed bottom-6 left-6 z-[60] w-80"
        >
          <div
            className="relative rounded-2xl p-5 shadow-2xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #242424 100%)" }}
          >
            {/* Glow */}
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full pointer-events-none opacity-20"
              style={{ background: "radial-gradient(circle, #F26522, transparent)" }} />

            <button onClick={dismiss}
              className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(242,101,34,0.18)" }}>
                <Gift className="h-5 w-5 text-[#F26522]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Sparkles className="h-3 w-3 text-[#F26522]" />
                  <span className="text-[10px] font-bold text-[#F26522] uppercase tracking-widest">Только для новых</span>
                </div>
                <p className="text-white font-black text-[15px] leading-tight">
                  500 баллов в подарок
                </p>
              </div>
            </div>

            <p className="text-white/50 text-xs leading-relaxed mb-4">
              Зарегистрируйтесь и получите <span className="text-white/80 font-semibold">500 приветственных баллов</span> на любую покупку — спишутся автоматически при оформлении заказа.
            </p>

            <div className="flex gap-2">
              <Link href="/customer/register" onClick={dismiss}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white text-center transition-all active:scale-95"
                style={{ background: "#F26522" }}>
                Получить баллы
              </Link>
              <button onClick={dismiss}
                className="px-3 py-2.5 rounded-xl text-xs font-medium text-white/40 hover:text-white/60 transition-colors">
                Позже
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

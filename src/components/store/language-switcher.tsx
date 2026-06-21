"use client"

import { useState, useRef, useEffect } from "react"
import { Globe, Check } from "lucide-react"

const LANGS = [
  { code: "ru",    label: "Русский",  flag: "🇷🇺" },
  { code: "en",    label: "English",  flag: "🇬🇧" },
  { code: "zh-CN", label: "中文",     flag: "🇨🇳" },
  { code: "ar",    label: "العربية",  flag: "🇸🇦" },
  { code: "de",    label: "Deutsch",  flag: "🇩🇪" },
  { code: "fr",    label: "Français", flag: "🇫🇷" },
]

export function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState("ru")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const m = document.cookie.match(/googtrans=\/ru\/([^;]+)/)
    if (m) setLang(decodeURIComponent(m[1]))
  }, [])

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  function select(code: string) {
    setLang(code)
    setOpen(false)

    if (code === "ru") {
      // Clear translation cookies
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`
    } else {
      document.cookie = `googtrans=/ru/${code}; path=/`
      document.cookie = `googtrans=/ru/${code}; path=/; domain=.${window.location.hostname}`
    }

    window.location.reload()
  }

  const current = LANGS.find(l => l.code === lang) ?? LANGS[0]

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 group transition-colors"
        title="Язык / Language"
      >
        <Globe className="h-3.5 w-3.5 text-[#bbb] group-hover:text-[#555] transition-colors" />
        <span className="text-[10px] font-bold tracking-[0.08em] text-[#bbb] group-hover:text-[#555] transition-colors">
          {current.code.slice(0, 2).toUpperCase()}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-9 w-44 rounded-2xl bg-white overflow-hidden z-50"
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)" }}
        >
          <div className="py-1.5">
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => select(l.code)}
                className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#f7f7f7] transition-colors text-left"
              >
                <span className="text-sm leading-none">{l.flag}</span>
                <span className="text-sm font-medium text-[#1a1a1a] flex-1">{l.label}</span>
                {lang === l.code && <Check className="h-3.5 w-3.5 text-[#F26522] shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

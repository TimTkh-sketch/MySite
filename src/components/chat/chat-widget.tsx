"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, Bot } from "lucide-react"
import { usePathname } from "next/navigation"

interface Operator {
  id: string
  name: string
  avatar: string | null
  isOnline: boolean
}

interface Message {
  id: string
  sender: string
  text: string
  createdAt: string
}

const SESSION_KEY = "chat_session_id"

// Virtual greeting shown before any real messages
const GREETING_ID = "__greeting__"

export function ChatWidget({ storeId }: { storeId: string }) {
  const [open, setOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [dbMessages, setDbMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [operators, setOperators] = useState<Operator[]>([])
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pathname = usePathname()

  const onlineOp = operators.find(o => o.isOnline) ?? operators[0] ?? null
  const anyOnline = operators.some(o => o.isOnline)

  // Greeting is always the first displayed message (virtual, not in DB)
  const greeting: Message = {
    id: GREETING_ID,
    sender: "operator",
    text: "Здравствуйте! Чем можем вам помочь? 🙂",
    createdAt: new Date().toISOString(),
  }
  const messages: Message[] = [greeting, ...dbMessages]

  // Load operators
  useEffect(() => {
    fetch(`/api/chat/operators?storeId=${storeId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setOperators(data) })
      .catch(() => {})
  }, [storeId])

  // Load existing session from localStorage
  useEffect(() => {
    const sid = localStorage.getItem(SESSION_KEY + "_" + storeId)
    if (sid) setSessionId(sid)
  }, [storeId])

  // Auto-open on first load (once, after operators loaded)
  const didAutoOpen = useRef(false)
  useEffect(() => {
    if (didAutoOpen.current) return
    const t = setTimeout(() => {
      setOpen(true)
      didAutoOpen.current = true
    }, 800)
    return () => clearTimeout(t)
  }, [])

  const fetchMessages = useCallback(async (sid: string) => {
    try {
      const r = await fetch(`/api/chat/messages?sessionId=${sid}`)
      if (!r.ok) return
      const data: Message[] = await r.json()
      setDbMessages(prev => {
        const incoming = data.filter(m => m.sender !== "visitor" && !prev.find(p => p.id === m.id))
        if (!open && incoming.length > 0) setUnread(u => u + incoming.length)
        return data
      })
    } catch {}
  }, [open])

  useEffect(() => {
    if (!sessionId) return
    fetchMessages(sessionId)
    if (open) {
      pollRef.current = setInterval(() => fetchMessages(sessionId), 2000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [sessionId, open, fetchMessages])

  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  async function createSession() {
    const r = await fetch("/api/chat/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, visitorPage: pathname }),
    })
    const s = await r.json()
    localStorage.setItem(SESSION_KEY + "_" + storeId, s.id)
    setSessionId(s.id)
    return s.id as string
  }

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return
    setSending(true)

    let sid = sessionId
    if (!sid) sid = await createSession()

    const optimistic: Message = {
      id: "tmp_" + Date.now(),
      sender: "visitor",
      text,
      createdAt: new Date().toISOString(),
    }
    setDbMessages(prev => [...prev, optimistic])
    setInput("")

    try {
      await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, text, sender: "visitor" }),
      })
      if (sid) await fetchMessages(sid)
    } finally {
      setSending(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const CHAT_BG = "#16a34a"

  return (
    <>
      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="fixed bottom-[88px] right-6 z-[9999] flex flex-col overflow-hidden"
            style={{
              width: 360,
              height: 520,
              borderRadius: 20,
              boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
              background: "#fff",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 shrink-0"
              style={{ background: CHAT_BG }}
            >
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0 border border-white/20">
                {onlineOp?.avatar ? (
                  <img src={onlineOp.avatar} alt={onlineOp.name} className="w-full h-full object-cover" />
                ) : onlineOp ? (
                  <span>{onlineOp.name[0]?.toUpperCase()}</span>
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-none truncate">
                  {onlineOp?.name ?? "Поддержка"}
                </p>
                <p className="text-white/50 text-xs mt-0.5 flex items-center gap-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${anyOnline ? "bg-emerald-400" : "bg-gray-400"}`} />
                  {anyOnline ? "Онлайн" : "Офлайн"}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`flex items-end gap-1.5 ${m.sender === "visitor" ? "justify-end" : "justify-start"}`}
                >
                  {(m.sender === "operator" || m.sender === "bot") && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden border"
                      style={{ background: CHAT_BG, borderColor: "rgba(0,0,0,0.08)" }}
                    >
                      {m.sender === "bot" ? (
                        <Bot className="h-3.5 w-3.5" />
                      ) : onlineOp?.avatar ? (
                        <img src={onlineOp.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        onlineOp?.name[0]?.toUpperCase() ?? "O"
                      )}
                    </div>
                  )}
                  <div
                    className="text-sm leading-relaxed"
                    style={{
                      maxWidth: "80%",
                      padding: "10px 14px",
                      borderRadius:
                        m.sender === "visitor"
                          ? "18px 18px 4px 18px"
                          : "18px 18px 18px 4px",
                      background:
                        m.sender === "visitor"
                          ? CHAT_BG
                          : "#f2f2f2",
                      color: m.sender === "visitor" ? "white" : "#1a1a1a",
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              className="shrink-0 flex items-center gap-2 px-3 py-3 border-t"
              style={{ borderColor: "#f0f0f0" }}
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Введите сообщение..."
                className="flex-1 text-sm px-3 py-2 rounded-xl border border-[#e8e8e8] bg-[#fafafa] placeholder-[#bbb] outline-none focus:border-[#1a1a1a] transition-colors"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || sending}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-30"
                style={{ background: CHAT_BG }}
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger button — dark, не сливается с оранжевыми элементами */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-transform hover:scale-110 active:scale-95"
            style={{ background: CHAT_BG }}
            title="Написать нам"
          >
            <MessageCircle className="h-6 w-6" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#F26522] text-white text-[10px] font-black flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}

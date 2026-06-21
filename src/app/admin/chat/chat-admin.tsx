"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  MessageCircle, User, XCircle, Send, Zap, Settings,
  Bot, CheckCircle2, Clock, Lock, UserCheck, RotateCcw,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

interface ChatOperator {
  id: string
  name: string
  avatar: string | null
  isOnline: boolean
}

interface Session {
  id: string
  visitorName: string | null
  visitorPage: string | null
  status: string
  operatorId: string | null
  postponedUntil: string | null
  unreadCount: number
  createdAt: string
  updatedAt: string
  messages: Message[]
}

interface Message {
  id: string
  sessionId: string
  sender: string
  text: string
  createdAt: string
  isRead: boolean
}

const STATUS_LABELS: Record<string, string> = {
  waiting:   "Ожидают",
  active:    "Активные",
  postponed: "Отложенные",
  closed:    "Закрытые",
}

const STATUS_COLORS: Record<string, string> = {
  waiting:   "bg-amber-100 text-amber-700",
  active:    "bg-emerald-100 text-emerald-700",
  postponed: "bg-blue-100 text-blue-600",
  closed:    "bg-gray-100 text-gray-500",
}

const OP_KEY = "chat_current_operator_id"

export function ChatAdmin({
  storeId,
  quickReplies,
  operators,
}: {
  storeId: string
  quickReplies: string[]
  operators: ChatOperator[]
}) {
  const [filter, setFilter] = useState<string>("waiting")
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  // Current operator identity (persisted in localStorage)
  const [currentOpId, setCurrentOpId] = useState<string>("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeSession = sessions.find(s => s.id === activeId) ?? null
  const currentOp = operators.find(o => o.id === currentOpId) ?? null

  // Load saved operator identity
  useEffect(() => {
    const saved = localStorage.getItem(OP_KEY)
    if (saved) setCurrentOpId(saved)
    else if (operators.length > 0) {
      setCurrentOpId(operators[0].id)
      localStorage.setItem(OP_KEY, operators[0].id)
    }
  }, [operators])

  const fetchSessions = useCallback(async () => {
    try {
      const r = await fetch(`/api/chat/session?storeId=${storeId}&status=${filter}`)
      const data = await r.json()
      if (Array.isArray(data)) setSessions(data)
    } catch {}
  }, [storeId, filter])

  const fetchMessages = useCallback(async (sid: string) => {
    try {
      const r = await fetch(`/api/chat/messages?sessionId=${sid}`)
      const data = await r.json()
      if (Array.isArray(data)) setMessages(data)
    } catch {}
  }, [])

  useEffect(() => {
    fetchSessions()
    const t = setInterval(fetchSessions, 3000)
    return () => clearInterval(t)
  }, [fetchSessions])

  useEffect(() => {
    if (!activeId) return
    fetchMessages(activeId)
    const t = setInterval(() => fetchMessages(activeId), 2000)
    return () => clearInterval(t)
  }, [activeId, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function patchSession(id: string, body: Record<string, unknown>) {
    await fetch(`/api/chat/session/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    fetchSessions()
  }

  async function acceptSession() {
    if (!activeId || !currentOpId) return
    await patchSession(activeId, { status: "active", operatorId: currentOpId })
  }

  async function postponeSession() {
    if (!activeId) return
    const postponedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    await patchSession(activeId, { status: "postponed", postponedUntil, operatorId: null })
    setActiveId(null)
    setMessages([])
  }

  async function closeSession() {
    if (!activeId) return
    await patchSession(activeId, { status: "closed", postponedUntil: null })
    setActiveId(null)
    setMessages([])
  }

  async function reopenSession() {
    if (!activeId) return
    await patchSession(activeId, { status: "waiting", operatorId: null })
    fetchSessions()
  }

  async function sendMessage(text: string) {
    if (!activeId || !text.trim() || sending) return
    setSending(true)
    try {
      await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeId, text, sender: "operator" }),
      })
      setInput("")
      await fetchMessages(activeId)
    } finally {
      setSending(false)
    }
  }

  // Is current operator the one who owns this session?
  const isMine = activeSession?.operatorId === currentOpId
  // Is this session taken by someone else?
  const takenByOther = activeSession?.operatorId && activeSession.operatorId !== currentOpId
  const takenByOp = operators.find(o => o.id === activeSession?.operatorId)

  // Can current operator write?
  const canWrite =
    activeSession?.status !== "closed" &&
    activeSession?.status !== "postponed" &&
    !takenByOther

  const totalUnread = sessions.reduce((s, x) => s + (x.unreadCount || 0), 0)

  return (
    <div
      className="flex flex-1 gap-0 rounded-xl overflow-hidden border border-gray-200 bg-white min-h-0"
    >
      {/* ─── LEFT: Session list ─────────────────────── */}
      <div className="w-80 shrink-0 flex flex-col border-r border-gray-200 min-h-0">

        {/* Operator selector */}
        {operators.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
            <UserCheck className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <select
              value={currentOpId}
              onChange={e => { setCurrentOpId(e.target.value); localStorage.setItem(OP_KEY, e.target.value) }}
              className="flex-1 text-xs font-medium text-gray-700 bg-transparent outline-none cursor-pointer"
            >
              {operators.map(op => (
                <option key={op.id} value={op.id}>{op.name}</option>
              ))}
            </select>
            <span className={cn(
              "w-2 h-2 rounded-full shrink-0",
              currentOp?.isOnline ? "bg-emerald-400" : "bg-gray-300"
            )} />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-[#F26522]" />
            <span className="font-semibold text-sm text-gray-900">Чаты</span>
            {totalUnread > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#F26522] text-white text-[10px] font-black flex items-center justify-center">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </div>
          <Link
            href="/admin/chat/settings"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          {["waiting", "active", "postponed", "closed"].map(s => (
            <button
              key={s}
              onClick={() => { setFilter(s); setActiveId(null); setMessages([]) }}
              className={cn(
                "flex-1 py-2 text-[10px] font-semibold transition-colors",
                filter === s
                  ? "text-[#F26522] border-b-2 border-[#F26522]"
                  : "text-gray-400 hover:text-gray-700"
              )}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-300">
              <MessageCircle className="h-8 w-8 opacity-30" />
              <p className="text-xs">Нет чатов</p>
            </div>
          ) : (
            sessions.map(s => {
              const lastMsg = s.messages?.[0]
              const takenByMe = s.operatorId === currentOpId
              const takenByAnother = s.operatorId && !takenByMe
              const takenOp = operators.find(o => o.id === s.operatorId)
              return (
                <button
                  key={s.id}
                  onClick={() => { setActiveId(s.id); fetchMessages(s.id) }}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-gray-50 transition-colors hover:bg-gray-50",
                    activeId === s.id && "bg-orange-50 border-l-2 border-l-[#F26522]",
                    takenByAnother && "opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#F26522]/10 flex items-center justify-center shrink-0 relative">
                        <User className="h-4 w-4 text-[#F26522]" />
                        {takenByAnother && (
                          <Lock className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-gray-400 bg-white rounded-full" />
                        )}
                        {takenByMe && (
                          <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-emerald-500 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {s.visitorName || "Посетитель"}
                        </p>
                        {lastMsg ? (
                          <p className="text-xs text-gray-400 truncate">{lastMsg.text}</p>
                        ) : takenByAnother ? (
                          <p className="text-xs text-gray-400">Принято: {takenOp?.name}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full", STATUS_COLORS[s.status])}>
                        {STATUS_LABELS[s.status]}
                      </span>
                      {s.unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-[#F26522] text-white text-[9px] font-black flex items-center justify-center">
                          {s.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  {s.postponedUntil && s.status === "postponed" && (
                    <p className="text-[10px] text-blue-400 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Вернётся {formatDistanceToNow(new Date(s.postponedUntil), { addSuffix: true, locale: ru })}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-300 mt-0.5">
                    {formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true, locale: ru })}
                  </p>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ─── RIGHT: Chat window ─────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0">
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-300">
            <MessageCircle className="h-16 w-16 opacity-20" />
            <p className="text-sm">Выберите чат слева</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F26522]/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-[#F26522]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {activeSession?.visitorName || "Посетитель"}
                  </p>
                  {activeSession?.visitorPage && (
                    <p className="text-xs text-gray-400 truncate max-w-[220px]">{activeSession.visitorPage}</p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-full", STATUS_COLORS[activeSession?.status ?? "waiting"])}>
                  {STATUS_LABELS[activeSession?.status ?? "waiting"]}
                </span>

                {takenByOther && takenByOp && (
                  <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                    <Lock className="h-3 w-3" />
                    {takenByOp.name}
                  </span>
                )}

                {/* Accept button — for waiting or unassigned */}
                {(activeSession?.status === "waiting" || (activeSession?.status === "active" && !activeSession.operatorId)) && !takenByOther && (
                  <button
                    onClick={acceptSession}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Принять диалог
                  </button>
                )}

                {isMine && activeSession?.status !== "closed" && (
                  <>
                    <button
                      onClick={postponeSession}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors border border-blue-100"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Отложить 5 мин
                    </button>
                    <button
                      onClick={closeSession}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors border border-red-100"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Закрыть
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Locked banner */}
            {takenByOther && takenByOp && (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 border-b border-amber-100 shrink-0">
                <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700">
                  Диалог принят оператором <strong>{takenByOp.name}</strong>. Вы можете только читать.
                </p>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.map(m => (
                <div key={m.id} className={`flex items-end gap-1.5 ${m.sender === "visitor" ? "justify-start" : "justify-end"}`}>
                  {m.sender === "visitor" && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5 text-gray-500" />
                    </div>
                  )}
                  {m.sender === "bot" && (
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <Bot className="h-3.5 w-3.5 text-purple-500" />
                    </div>
                  )}
                  <div
                    className="text-sm leading-relaxed"
                    style={{
                      maxWidth: "75%",
                      padding: "10px 14px",
                      borderRadius:
                        m.sender === "visitor"
                          ? "18px 18px 18px 4px"
                          : "18px 18px 4px 18px",
                      background:
                        m.sender === "visitor" ? "#f5f5f5"
                          : m.sender === "bot" ? "#f0e9ff"
                          : "#1a1a1a",
                      color:
                        m.sender === "visitor" ? "#1a1a1a"
                          : m.sender === "bot" ? "#6b21a8"
                          : "white",
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            {quickReplies.length > 0 && canWrite && (
              <div className="flex gap-2 flex-wrap px-4 py-2 border-t border-gray-50 shrink-0">
                {quickReplies.map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(qr)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Zap className="h-3 w-3 text-[#F26522]" />
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            {activeSession?.status === "closed" || activeSession?.status === "postponed" ? (
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-100 shrink-0">
                {activeSession.status === "postponed" ? (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-300" />
                    <p className="text-sm text-blue-400">Диалог отложен на 5 минут</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gray-300" />
                    <p className="text-sm text-gray-400">Чат закрыт</p>
                  </div>
                )}
                <button
                  onClick={reopenSession}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors border border-emerald-100"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Открыть снова
                </button>
              </div>
            ) : canWrite ? (
              <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 shrink-0">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
                  }}
                  placeholder="Напишите ответ..."
                  className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 placeholder-gray-400 outline-none focus:border-gray-900 transition-colors"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || sending}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-40 bg-[#1a1a1a]"
                >
                  <Send className="h-4 w-4 text-white" />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

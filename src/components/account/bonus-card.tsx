"use client"

import { motion } from "framer-motion"
import { Tier, TIER_LABELS, TIER_CASHBACK, getNextTierThreshold } from "@/lib/bonus"

interface BonusCardProps {
  cardNumber: string
  firstName: string
  lastName: string
  balance: number
  totalEarned: number
  tier: Tier
}

const TIER_STYLES: Record<Tier, {
  bg: string; text: string; accent: string; numberColor: string; shine: boolean; glow: boolean
}> = {
  black: {
    bg: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #0a0a0a 100%)",
    text: "#ffffff",
    accent: "#F26522",
    numberColor: "#F26522",
    shine: false,
    glow: false,
  },
  silver: {
    bg: "linear-gradient(135deg, #8a9bb0 0%, #c8d6e0 40%, #ffffff 50%, #9eb0c0 60%, #8a9bb0 100%)",
    text: "#1a1a1a",
    accent: "#4a5568",
    numberColor: "#1a1a1a",
    shine: true,
    glow: false,
  },
  gold: {
    bg: "linear-gradient(135deg, #B8860B 0%, #D4A017 30%, #FFD700 50%, #DAA520 70%, #B8860B 100%)",
    text: "#1a1a1a",
    accent: "#5c3d00",
    numberColor: "#1a1a1a",
    shine: true,
    glow: true,
  },
}

const TIER_NEXT: Record<Tier, { label: string; max: number; current: number } | null> = {
  black:  null, // filled dynamically
  silver: null,
  gold:   null,
}

export function BonusCard({ cardNumber, firstName, lastName, balance, totalEarned, tier }: BonusCardProps) {
  const style = TIER_STYLES[tier]
  const nextThreshold = getNextTierThreshold(tier)

  const progress = nextThreshold
    ? tier === "black"
      ? Math.min(100, (totalEarned / 10000) * 100)
      : Math.min(100, ((totalEarned - 10000) / 40000) * 100)
    : 100

  const remaining = nextThreshold ? Math.max(0, nextThreshold - totalEarned) : 0
  const nextLabel = tier === "black" ? "SILVER" : tier === "silver" ? "GOLD" : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, rotateX: -12 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        whileHover={style.glow ? { scale: 1.02, boxShadow: "0 0 40px rgba(255,215,0,0.4)" } : { scale: 1.01 }}
        transition={{ duration: 0.3 }}
        className={style.shine ? "card-shine" : ""}
        style={{
          background: style.bg,
          borderRadius: 20,
          padding: "28px 28px 24px",
          width: "100%",
          maxWidth: 420,
          aspectRatio: "1.586",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          boxShadow: style.glow
            ? "0 8px 32px rgba(184,134,11,0.35)"
            : "0 8px 32px rgba(0,0,0,0.20)",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute", top: -40, right: -40,
            width: 160, height: 160, borderRadius: "50%",
            background: tier === "black"
              ? "rgba(242,101,34,0.07)"
              : "rgba(255,255,255,0.12)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute", bottom: -30, left: -20,
            width: 120, height: 120, borderRadius: "50%",
            background: tier === "black"
              ? "rgba(255,255,255,0.03)"
              : "rgba(255,255,255,0.08)",
            pointerEvents: "none",
          }}
        />

        {/* Top row */}
        <div className="flex items-center justify-between">
          <span
            style={{
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: style.accent,
            }}
          >
            GM<span style={{ color: style.text, fontWeight: 300 }}>°</span>
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: style.accent,
              opacity: 0.8,
            }}
          >
            {TIER_LABELS[tier]} · {TIER_CASHBACK[tier]} кэшбэк
          </span>
        </div>

        {/* Balance */}
        <div>
          <p style={{ fontSize: 12, color: style.text, opacity: 0.5, marginBottom: 2 }}>
            Бонусный баланс
          </p>
          <p
            style={{
              fontSize: 42,
              fontWeight: 900,
              color: style.text,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            {balance.toLocaleString("ru")}
            <span style={{ fontSize: 20, opacity: 0.5, marginLeft: 4 }}>₽</span>
          </p>
        </div>

        {/* Bottom */}
        <div className="flex items-end justify-between">
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: style.numberColor,
                letterSpacing: "0.1em",
                fontFamily: "monospace",
              }}
            >
              {cardNumber}
            </p>
            <p style={{ fontSize: 12, color: style.text, opacity: 0.6, marginTop: 2 }}>
              {firstName} {lastName}
            </p>
          </div>
          {/* Chip icon */}
          <div
            style={{
              width: 36, height: 28,
              borderRadius: 6,
              background: tier === "black"
                ? "rgba(242,101,34,0.3)"
                : "rgba(255,255,255,0.35)",
              border: `1px solid ${tier === "black" ? "rgba(242,101,34,0.4)" : "rgba(255,255,255,0.5)"}`,
            }}
          />
        </div>
      </motion.div>

      {/* Progress bar */}
      {nextLabel && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400 font-medium">
              {tier.toUpperCase()} → {nextLabel}
            </span>
            <span className="text-xs text-gray-500">
              {tier === "gold"
                ? "Вы на вершине 👑"
                : `До ${nextLabel} осталось ${remaining.toLocaleString("ru")} ₽`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background:
                  tier === "black"
                    ? "linear-gradient(90deg, #F26522, #ff8c42)"
                    : "linear-gradient(90deg, #B8860B, #FFD700)",
              }}
            />
          </div>
        </div>
      )}
      {tier === "gold" && (
        <p className="mt-3 text-center text-xs text-yellow-600 font-semibold">
          Вы на вершине — максимальный уровень достигнут 👑
        </p>
      )}
    </motion.div>
  )
}

// Attach tier for decorative circle workaround
declare module "@/lib/bonus" {
  interface TierStyleExt { tier: Tier }
}

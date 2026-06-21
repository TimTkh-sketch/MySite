export type Tier = "black" | "silver" | "gold"

export function getTier(totalEarned: number): Tier {
  if (totalEarned >= 50000) return "gold"
  if (totalEarned >= 10000) return "silver"
  return "black"
}

export function getCashbackRate(tier: Tier): number {
  switch (tier) {
    case "gold":   return 0.10
    case "silver": return 0.05
    default:       return 0.03
  }
}

export function getBirthdayBonus(tier: Tier): number {
  switch (tier) {
    case "gold":   return 1500
    case "silver": return 750
    default:       return 500
  }
}

export function getNextTierThreshold(tier: Tier): number | null {
  switch (tier) {
    case "black":  return 10000
    case "silver": return 50000
    default:       return null
  }
}

export function generateCardNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `GM-${seg(4)}-${seg(4)}`
}

export const TIER_LABELS: Record<Tier, string> = {
  black:  "BLACK",
  silver: "SILVER",
  gold:   "GOLD",
}

export const TIER_CASHBACK: Record<Tier, string> = {
  black:  "3%",
  silver: "5%",
  gold:   "10%",
}

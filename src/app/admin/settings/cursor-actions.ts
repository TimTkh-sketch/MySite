"use server"

import { auth } from "@/lib/auth"
import { writeCursorConfig, type CursorConfig } from "@/lib/cursor-config"

export async function saveCursorConfig(config: CursorConfig) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  writeCursorConfig(config)
}

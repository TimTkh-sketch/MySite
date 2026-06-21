import { readFileSync, writeFileSync, existsSync } from "fs"
import path from "path"

export interface CursorConfig {
  enabled: boolean
  color: string
  size: number
  blendMode: "difference" | "normal"
  ringEnabled: boolean
}

export const DEFAULT_CURSOR: CursorConfig = {
  enabled: true,
  color: "#F26522",
  size: 12,
  blendMode: "difference",
  ringEnabled: true,
}

const CONFIG_PATH = path.join(process.cwd(), "cursor-config.json")

export function getCursorConfig(): CursorConfig {
  try {
    if (!existsSync(CONFIG_PATH)) return DEFAULT_CURSOR
    return { ...DEFAULT_CURSOR, ...JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) }
  } catch {
    return DEFAULT_CURSOR
  }
}

export function writeCursorConfig(config: CursorConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

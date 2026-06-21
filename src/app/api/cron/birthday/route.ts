import { NextResponse } from "next/server"
import { processBirthdays } from "@/lib/birthday-cron"

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret")
  if (secret !== (process.env.CRON_SECRET ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const count = await processBirthdays()
  return NextResponse.json({ processed: count })
}

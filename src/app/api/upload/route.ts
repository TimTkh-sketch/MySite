import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.split(".").pop() ?? "jpg"
  const filename = `${randomUUID()}.${ext}`
  const path = join(process.cwd(), "public", "uploads", filename)

  await writeFile(path, buffer)

  return NextResponse.json({ url: `/uploads/${filename}` })
}

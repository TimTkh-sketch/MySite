import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SessionProvider } from "next-auth/react"
import "./globals.css"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: "MyShop Platform",
  description: "E-commerce platform",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}

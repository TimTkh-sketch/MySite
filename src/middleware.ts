import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(
  process.env.CUSTOMER_JWT_SECRET ?? "customer-secret-key-change-in-prod"
)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAccountRoute =
    pathname.startsWith("/account") ||
    /^\/store\/[^/]+\/account/.test(pathname)

  if (isAccountRoute) {
    const token = req.cookies.get("customer_token")?.value
    if (!token) {
      return NextResponse.redirect(new URL("/customer/login", req.url))
    }
    try {
      await jwtVerify(token, secret)
    } catch {
      const res = NextResponse.redirect(new URL("/customer/login", req.url))
      res.cookies.delete("customer_token")
      return res
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/account/:path*", "/store/:slug/account/:path*"],
}

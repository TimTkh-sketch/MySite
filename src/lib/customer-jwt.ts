import { SignJWT, jwtVerify } from "jose"

const secret = () =>
  new TextEncoder().encode(
    process.env.CUSTOMER_JWT_SECRET ?? "customer-secret-key-change-in-prod"
  )

export async function signCustomerToken(customerId: string): Promise<string> {
  return new SignJWT({ customerId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret())
}

export async function verifyCustomerToken(
  token: string
): Promise<{ customerId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return { customerId: payload.customerId as string }
  } catch {
    return null
  }
}

export function getTokenFromCookieHeader(cookieHeader: string): string | null {
  const match = cookieHeader.match(/customer_token=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export async function getCustomerIdFromRequest(
  req: Request
): Promise<string | null> {
  const cookie = req.headers.get("cookie") ?? ""
  const token = getTokenFromCookieHeader(cookie)
  if (!token) return null
  const payload = await verifyCustomerToken(token)
  return payload?.customerId ?? null
}

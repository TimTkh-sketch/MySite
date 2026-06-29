import Link from "next/link"
import { Phone, MapPin, Clock } from "lucide-react"

interface Store {
  name: string
  slug: string
  settings?: {
    phone?: string | null
    address?: string | null
    workingHours?: string | null
    socialVk?: string | null
    socialTg?: string | null
  } | null
}

export function StoreFooter({ store }: { store: Store }) {
  const base = `/store/${store.slug}`

  return (
    <footer style={{ background: "#000", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "80px 0 36px" }}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8">

          {/* Brand */}
          <div>
            <Link
              href={base}
              style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", color: "#fff", textDecoration: "none", display: "inline-block", marginBottom: 16 }}
            >
              {store.name}<span style={{ color: "var(--accent)", fontWeight: 300 }}>°</span>
            </Link>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-3)", maxWidth: 240, marginBottom: 20 }}>
              Самый дружелюбный магазин гаджетов в Перми. Работаем с 2012 года.
            </p>

            {store.settings?.phone && (
              <a href={`tel:${store.settings.phone}`} className="inline-flex items-center gap-2" style={{ fontSize: 14, fontWeight: 600, color: "#fff", textDecoration: "none" }}>
                <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
                {store.settings.phone}
              </a>
            )}

            {(store.settings?.socialVk || store.settings?.socialTg) && (
              <div className="flex items-center gap-2 mt-5">
                {store.settings.socialVk && (
                  <a href={store.settings.socialVk} target="_blank" rel="noopener noreferrer" className="social-icon">ВК</a>
                )}
                {store.settings.socialTg && (
                  <a href={store.settings.socialTg} target="_blank" rel="noopener noreferrer" className="social-icon">TG</a>
                )}
              </div>
            )}

            {store.settings?.address && (
              <div className="flex items-start gap-2 mt-4" style={{ fontSize: 13, color: "var(--text-3)" }}>
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
                {store.settings.address}
              </div>
            )}
            {store.settings?.workingHours && (
              <div className="flex items-center gap-2 mt-2" style={{ fontSize: 13, color: "var(--text-3)" }}>
                <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
                {store.settings.workingHours}
              </div>
            )}
          </div>

          {/* Catalog */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 20 }}>
              Каталог
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Все товары",   href: `${base}/catalog` },
                { label: "Хиты продаж", href: `${base}/catalog?featured=1` },
                { label: "Новинки",      href: `${base}/catalog?sort=new` },
                { label: "Корзина",      href: `${base}/checkout` },
              ].map(({ label, href }) => (
                <Link key={label} href={href} style={{ fontSize: 14, color: "var(--text-3)", textDecoration: "none" }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Help */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 20 }}>
              Помощь
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Доставка и оплата",  href: "#" },
                { label: "Гарантия и возврат", href: "#" },
                { label: "Личный кабинет",     href: "/customer/login" },
                { label: "Бонусная программа", href: `${base}/account` },
              ].map(({ label, href }) => (
                <Link key={label} href={href} style={{ fontSize: 14, color: "var(--text-3)", textDecoration: "none" }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span style={{ fontSize: 13, color: "var(--text-3)" }}>
            © {new Date().getFullYear()} {store.name}. Все права защищены.
          </span>
          <Link href="#" style={{ fontSize: 13, color: "var(--text-3)", textDecoration: "none" }}>
            Политика конфиденциальности
          </Link>
        </div>
      </div>
    </footer>
  )
}

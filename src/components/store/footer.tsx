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
    <footer style={{ background: "var(--bg-dark)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "64px 0 32px" }}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">

          {/* Бренд */}
          <div>
            <Link
              href={base}
              className="inline-block text-[17px] font-black tracking-tight mb-4"
              style={{ color: "#fff" }}
            >
              {store.name}<span style={{ color: "var(--accent-on-dark)", fontWeight: 300 }}>°</span>
            </Link>
            <p className="text-[14px] leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.40)", maxWidth: 240 }}>
              Самый дружелюбный магазин гаджетов в Перми. Работаем с 2012 года.
            </p>

            {store.settings?.phone && (
              <a
                href={`tel:${store.settings.phone}`}
                className="inline-flex items-center gap-2 text-[14px] font-semibold"
                style={{ color: "#fff" }}
              >
                <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-on-dark)" }} />
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
              <div className="flex items-start gap-2 mt-4 text-[13px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "var(--accent-on-dark)" }} />
                {store.settings.address}
              </div>
            )}
            {store.settings?.workingHours && (
              <div className="flex items-center gap-2 mt-2 text-[13px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-on-dark)" }} />
                {store.settings.workingHours}
              </div>
            )}
          </div>

          {/* Каталог */}
          <div>
            <p className="text-[11px] font-bold tracking-[0.10em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.25)" }}>
              Каталог
            </p>
            <div className="space-y-3">
              {[
                { label: "Все товары",   href: `${base}/catalog` },
                { label: "Хиты продаж", href: `${base}/catalog?featured=1` },
                { label: "Новинки",      href: `${base}/catalog?sort=new` },
                { label: "Корзина",      href: `${base}/checkout` },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="block text-[14px] transition-colors"
                  style={{ color: "rgba(255,255,255,0.50)" }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Помощь */}
          <div>
            <p className="text-[11px] font-bold tracking-[0.10em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.25)" }}>
              Помощь
            </p>
            <div className="space-y-3">
              {[
                { label: "Доставка и оплата",  href: "#" },
                { label: "Гарантия и возврат", href: "#" },
                { label: "Личный кабинет",     href: "/customer/login" },
                { label: "Бонусная программа", href: `${base}/account` },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="block text-[14px] transition-colors"
                  style={{ color: "rgba(255,255,255,0.50)" }}
                >
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
          <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            © {new Date().getFullYear()} {store.name}. Все права защищены.
          </span>
          <Link href="#" className="text-[13px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            Политика конфиденциальности
          </Link>
        </div>
      </div>
    </footer>
  )
}

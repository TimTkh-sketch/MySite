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
    <footer
      style={{
        background: "var(--bg-gray)",
        borderTop: "1px solid rgba(0,0,0,0.07)",
        padding: "56px 0 32px",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">

        {/* Верхняя часть — 3 колонки */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">

          {/* Колонка 1: Бренд */}
          <div>
            <Link
              href={base}
              className="inline-block text-[15px] font-black tracking-tight mb-3"
              style={{ color: "var(--text)" }}
            >
              {store.name}<span style={{ color: "var(--accent)", fontWeight: 300 }}>°</span>
            </Link>
            <p
              className="text-[14px] leading-relaxed mb-5"
              style={{ color: "var(--text-2)", maxWidth: 240 }}
            >
              Самый дружелюбный магазин гаджетов в Перми. Работаем с 2012 года.
            </p>

            {store.settings?.phone && (
              <a
                href={`tel:${store.settings.phone}`}
                className="inline-flex items-center gap-2 text-[14px] font-semibold transition-colors hover:opacity-70"
                style={{ color: "var(--text)" }}
              >
                <Phone className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
                {store.settings.phone}
              </a>
            )}

            {/* Соцсети */}
            {(store.settings?.socialVk || store.settings?.socialTg) && (
              <div className="flex items-center gap-2 mt-4">
                {store.settings.socialVk && (
                  <a
                    href={store.settings.socialVk}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-black transition-all"
                    style={{
                      background: "rgba(0,0,0,0.06)",
                      color: "var(--text-2)",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = "var(--accent)"
                      el.style.color = "#fff"
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = "rgba(0,0,0,0.06)"
                      el.style.color = "var(--text-2)"
                    }}
                  >
                    ВК
                  </a>
                )}
                {store.settings.socialTg && (
                  <a
                    href={store.settings.socialTg}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-black transition-all"
                    style={{
                      background: "rgba(0,0,0,0.06)",
                      color: "var(--text-2)",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = "var(--accent)"
                      el.style.color = "#fff"
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = "rgba(0,0,0,0.06)"
                      el.style.color = "var(--text-2)"
                    }}
                  >
                    TG
                  </a>
                )}
              </div>
            )}

            {/* Адрес / режим */}
            {store.settings?.address && (
              <div className="flex items-start gap-2 mt-4 text-[13px]" style={{ color: "var(--text-3)" }}>
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
                {store.settings.address}
              </div>
            )}
            {store.settings?.workingHours && (
              <div className="flex items-center gap-2 mt-2 text-[13px]" style={{ color: "var(--text-3)" }}>
                <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
                {store.settings.workingHours}
              </div>
            )}
          </div>

          {/* Колонка 2: Каталог */}
          <div>
            <p
              className="text-[11px] font-semibold tracking-[0.08em] uppercase mb-4"
              style={{ color: "var(--text-3)" }}
            >
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
                  className="block text-[14px] transition-colors hover:opacity-70"
                  style={{ color: "var(--text-2)" }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Колонка 3: Помощь */}
          <div>
            <p
              className="text-[11px] font-semibold tracking-[0.08em] uppercase mb-4"
              style={{ color: "var(--text-3)" }}
            >
              Помощь
            </p>
            <div className="space-y-3">
              {[
                { label: "Доставка и оплата",        href: "#" },
                { label: "Гарантия и возврат",       href: "#" },
                { label: "Личный кабинет",           href: "/customer/login" },
                { label: "Бонусная программа",       href: `${base}/account` },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="block text-[14px] transition-colors hover:opacity-70"
                  style={{ color: "var(--text-2)" }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Нижняя полоса */}
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}
        >
          <span className="text-[13px]" style={{ color: "var(--text-3)" }}>
            © {new Date().getFullYear()} {store.name}. Все права защищены.
          </span>
          <Link
            href="#"
            className="text-[13px] transition-colors hover:opacity-70"
            style={{ color: "var(--text-3)" }}
          >
            Политика конфиденциальности
          </Link>
        </div>
      </div>
    </footer>
  )
}

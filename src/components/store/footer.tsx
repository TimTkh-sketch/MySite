import Link from "next/link"
import { Phone, MapPin, Clock } from "lucide-react"

interface Store {
  name: string
  slug: string
  settings?: {
    phone?: string | null
    address?: string | null
    workingHours?: string | null
  } | null
}

export function StoreFooter({ store }: { store: Store }) {
  const base = `/store/${store.slug}`

  return (
    <footer className="bg-[#1a1a1a] text-gray-400 mt-8">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <p className="font-bold text-white text-xl mb-2">{store.name}</p>
            <p className="text-sm text-gray-500 mb-4 max-w-xs">
              Самый дружелюбный магазин гаджетов в Перми. Работаем с 2012 года.
            </p>
            {store.settings?.phone && (
              <a
                href={`tel:${store.settings.phone}`}
                className="text-lg font-bold text-white hover:text-[#FF6B35] transition-colors"
              >
                {store.settings.phone}
              </a>
            )}
          </div>

          {/* Info */}
          <div className="space-y-3">
            <p className="font-semibold text-white text-sm mb-3">Контакты</p>
            {store.settings?.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-[#FF6B35]" />
                {store.settings.address}
              </div>
            )}
            {store.settings?.workingHours && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 shrink-0 text-[#FF6B35]" />
                {store.settings.workingHours}
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <p className="font-semibold text-white text-sm mb-3">Магазин</p>
            <div className="space-y-2">
              <Link href={`${base}/catalog`} className="block text-sm hover:text-white transition-colors">Каталог товаров</Link>
              <Link href={`${base}/catalog?featured=1`} className="block text-sm hover:text-white transition-colors">Хиты продаж</Link>
              <Link href={`${base}/checkout`} className="block text-sm hover:text-white transition-colors">Корзина</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <span>© {new Date().getFullYear()} {store.name}. Все права защищены.</span>
          <span>Техника с гарантией · Доставка по Перми</span>
        </div>
      </div>
    </footer>
  )
}

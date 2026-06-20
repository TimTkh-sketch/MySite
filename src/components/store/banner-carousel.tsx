"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Banner {
  id: string
  image: string
  title: string
  subtitle: string | null
  link: string | null
  buttonText: string | null
}

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => setCurrent((i) => (i + 1) % banners.length), [banners.length])
  const prev = () => setCurrent((i) => (i - 1 + banners.length) % banners.length)

  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(next, 5500)
    return () => clearInterval(t)
  }, [next, banners.length])

  if (!banners.length) return null

  return (
    <div className="relative w-full overflow-hidden bg-gray-100 select-none rounded-2xl" style={{ aspectRatio: "16/5.5" }}>
      {banners.map((b, i) => (
        <div
          key={b.id}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 10 : 0 }}
        >
          {/* Image */}
          <div className="relative w-full h-full">
            <Image
              src={b.image}
              alt={b.title}
              fill
              className="object-cover"
              priority={i === 0}
              sizes="100vw"
            />
          </div>

          {/* Optional button overlay */}
          {b.buttonText && (
            <div className="absolute bottom-8 left-8 z-20">
              {b.link ? (
                <Link
                  href={b.link}
                  className="inline-block px-7 py-3 bg-[#FF6B35] text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-lg"
                >
                  {b.buttonText}
                </Link>
              ) : (
                <span className="inline-block px-7 py-3 bg-[#FF6B35] text-white text-sm font-semibold rounded-xl shadow-lg">
                  {b.buttonText}
                </span>
              )}
            </div>
          )}

          {/* Clickable link overlay (when no button text) */}
          {!b.buttonText && b.link && (
            <Link href={b.link} className="absolute inset-0 z-10" aria-label={b.title} />
          )}
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full p-2.5 shadow-lg transition-all hover:scale-105"
            aria-label="Предыдущий"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/80 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full p-2.5 shadow-lg transition-all hover:scale-105"
            aria-label="Следующий"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 24 : 8,
                  height: 8,
                  backgroundColor: i === current ? "#FF6B35" : "rgba(255,255,255,0.7)",
                }}
                aria-label={`Слайд ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

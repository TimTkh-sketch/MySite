"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [current, setCurrent] = useState(0)

  if (!images.length) {
    return (
      <div className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300">
        Нет фото
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl bg-white border border-gray-100 overflow-hidden group">
        <Image
          src={images[current]}
          alt={name}
          fill
          className="object-contain p-4 transition-opacity duration-200"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />

        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={() => setCurrent((i) => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-4 w-4 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden bg-white transition-all ${
                i === current
                  ? "border-[#FF6B35] shadow-md"
                  : "border-gray-100 hover:border-gray-300"
              }`}
            >
              <Image
                src={img}
                alt=""
                fill
                className="object-contain p-1"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

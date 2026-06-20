import Image from "next/image"
import Link from "next/link"

interface MiniBanner {
  id: string
  title: string
  subtitle: string | null
  image: string
  link: string | null
  buttonText: string | null
}

export function MiniBanners({ banners }: { banners: MiniBanner[] }) {
  if (!banners.length) return null

  return (
    <div className={`grid gap-3 ${
      banners.length === 1 ? "grid-cols-1" :
      banners.length === 2 ? "grid-cols-2" :
      banners.length === 3 ? "grid-cols-3" :
      "grid-cols-2 md:grid-cols-4"
    }`}>
      {banners.map((b) => {
        const inner = (
          <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: "3.2/1" }}>
            <Image
              src={b.image}
              alt={b.title}
              fill
              className="object-cover hover:scale-[1.02] transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
        )

        return b.link ? (
          <Link key={b.id} href={b.link} className="block">
            {inner}
          </Link>
        ) : (
          <div key={b.id}>{inner}</div>
        )
      })}
    </div>
  )
}

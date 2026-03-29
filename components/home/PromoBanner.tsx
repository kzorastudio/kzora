import Image from 'next/image'
import Link from 'next/link'

interface Props {
  imageUrl: string
  link?: string
  heading: string
  subtext: string
}

export default function PromoBanner({ imageUrl, link, heading, subtext }: Props) {
  const content = (
    <div
      dir="rtl"
      className="relative w-full overflow-hidden"
      style={{ minHeight: '340px' }}
    >
      {/* Background image */}
      <Image
        src={imageUrl}
        alt={heading}
        fill
        sizes="100vw"
        className="object-cover"
        priority={false}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[340px] px-6 py-16 text-center">
        <h2 className="font-arabic text-4xl md:text-5xl font-extrabold text-white leading-tight max-w-2xl">
          {heading}
        </h2>

        {subtext && (
          <p className="font-arabic text-lg md:text-xl text-white/80 mt-4 max-w-xl leading-relaxed">
            {subtext}
          </p>
        )}

        {link && (
          <div className="mt-8">
            <span
              className="inline-flex items-center h-12 px-8 rounded-xl font-arabic font-semibold text-white text-base
                border-2 border-white/80
                hover:bg-white hover:text-[#1A1A1A]
                transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              تسوق الآن
            </span>
          </div>
        )}
      </div>
    </div>
  )

  if (link) {
    return (
      <section>
        <Link href={link} className="block group">
          {content}
        </Link>
      </section>
    )
  }

  return <section>{content}</section>
}

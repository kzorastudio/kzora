import { getImageProps } from 'next/image'

interface Props {
  /** Wide image, used above the breakpoint. */
  src: string
  /** Narrow image, used while `media` matches. */
  mobileSrc: string
  /** Media query for the narrow image, e.g. "(max-width: 639px)". */
  media: string
  alt: string
  sizes: string
  priority?: boolean
  className?: string
}

/** A `fill` image that swaps to a different picture on narrow screens. */
export function ArtDirectedImage({ src, mobileSrc, media, alt, sizes, priority, className }: Props) {
  const common = { alt, fill: true, sizes, priority }
  const { props: { srcSet: mobileSrcSet } } = getImageProps({ ...common, src: mobileSrc })
  const { props: imgProps } = getImageProps({ ...common, src })

  return (
    <picture>
      <source media={media} srcSet={mobileSrcSet} />
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img {...imgProps} className={className} />
    </picture>
  )
}

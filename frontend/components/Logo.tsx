import Image from 'next/image'

/**
 * Brand logo rendered from provided PNG assets.
 * Light and dark variants are switched by `:root.dark`.
 */
export function Logo({ className = 'h-7 w-auto' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`} aria-hidden="true">
      <Image
        src="/brand/08_inverse_white_bg_black_brackets_orange_inner.png"
        alt=""
        width={512}
        height={512}
        className="sc-logo-light block h-full w-auto"
      />
      <Image
        src="/brand/03_orange_inner_dark_bg.png"
        alt=""
        width={512}
        height={512}
        className="sc-logo-dark h-full w-auto"
      />
    </span>
  )
}

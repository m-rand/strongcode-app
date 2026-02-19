'use client'

/**
 * Simple StrongCode "SC" monogram logo.
 * Renders an inline SVG that inherits currentColor.
 */
export function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Accent bar */}
      <rect
        x="0"
        y="0"
        width="40"
        height="40"
        rx="6"
        fill="var(--accent-primary)"
      />
      {/* S */}
      <text
        x="8"
        y="30"
        fontFamily="var(--font-family, system-ui)"
        fontWeight="700"
        fontSize="26"
        fill="white"
        letterSpacing="-1"
      >
        SC
      </text>
    </svg>
  )
}

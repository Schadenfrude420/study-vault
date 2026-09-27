import { cn } from '../lib/utils'

interface LogoProps {
  className?: string
  size?: number
}

/**
 * Study Vault brand mark — a shield with a keyhole.
 * Uses `currentColor` so it inherits text color from the parent.
 */
export default function Logo({ className, size = 24 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <path
        d="M12 2.5l-8 3v6.5c0 4.8 3.4 9.1 8 10.5 4.6-1.4 8-5.7 8-10.5V5.5l-8-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="11"
        r="2.25"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M12 13.5v2.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}
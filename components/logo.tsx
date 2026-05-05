/* PayTrack logo — SVG mark + optional wordmark */

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 40, className = "" }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PayTrack logo"
      role="img"
    >
      <defs>
        <linearGradient
          id="pt-bg"
          x1="0" y1="0"
          x2="44" y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="oklch(0.606 0.25 292.717)" />
          <stop offset="1" stopColor="oklch(0.391 0.22 292.5)" />
        </linearGradient>

        {/* Subtle top-shine overlay */}
        <linearGradient
          id="pt-shine"
          x1="0" y1="0"
          x2="0" y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.18" />
          <stop offset="0.55" stopColor="white" stopOpacity="0" />
        </linearGradient>

        <clipPath id="pt-clip">
          <rect width="44" height="44" rx="11" />
        </clipPath>
      </defs>

      {/* Rounded-square background */}
      <rect width="44" height="44" rx="11" fill="url(#pt-bg)" />
      <rect width="44" height="44" rx="11" fill="url(#pt-shine)" />

      {/* ── "P" letterform ── */}
      {/* Vertical stem */}
      <line
        x1="12" y1="9.5"
        x2="12" y2="34.5"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Bowl arc: starts at stem top, bulges right, returns to stem midpoint */}
      <path
        d="M12 9.5 Q29 9.5 29 18 Q29 26.5 12 26.5"
        stroke="white"
        strokeWidth="3.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Checkmark badge (bottom-right, sits on top of background) ── */}
      {/* Shadow ring for depth */}
      <circle cx="31.5" cy="31.5" r="9.5" fill="black" fillOpacity="0.18" />
      {/* Green circle */}
      <circle cx="31.5" cy="31" r="9" fill="#16a34a" />
      {/* Inner highlight */}
      <circle cx="31.5" cy="31" r="9" fill="white" fillOpacity="0.08" />
      {/* Tick */}
      <path
        d="M27.5 31.5 L30.2 34.2 L35.5 27.5"
        stroke="white"
        strokeWidth="2.3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface LogoFullProps {
  markSize?: number;
  className?: string;
  textClassName?: string;
}

export function LogoFull({
  markSize = 36,
  className = "",
  textClassName = "",
}: LogoFullProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={markSize} />
      <span
        className={`font-heading text-xl font-bold leading-none ${textClassName}`}
      >
        PayTrack
      </span>
    </span>
  );
}

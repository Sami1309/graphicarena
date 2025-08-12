export function Logo({ size = 22 }: { size?: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c91ff" />
            <stop offset="100%" stopColor="#60f1d1" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="28" height="28" rx="6" fill="url(#g)" opacity="0.2" />
        <path d="M6 22l6-12 4 8 4-6 6 10" fill="none" stroke="url(#g)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <strong>GraphicArena</strong>
    </div>
  )
}


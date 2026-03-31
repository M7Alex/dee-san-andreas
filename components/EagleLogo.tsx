'use client'
// Petit aigle SVG institutionnel pour le logo DEE
export function EagleLogo({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Corps */}
      <ellipse cx="50" cy="62" rx="13" ry="18" fill="currentColor" opacity="0.9" />
      {/* Tête */}
      <circle cx="50" cy="36" r="10" fill="currentColor" />
      {/* Bec */}
      <polygon points="50,42 58,47 50,50" fill="currentColor" opacity="0.8" />
      {/* Oeil */}
      <circle cx="54" cy="33" r="2.5" fill="#050810" />
      <circle cx="54.8" cy="32.2" r="0.8" fill="currentColor" opacity="0.5" />
      {/* Aile gauche haute */}
      <path d="M40 55 L5 35 L14 52 L34 60 Z" fill="currentColor" opacity="0.85" />
      {/* Aile gauche basse */}
      <path d="M38 63 L2 68 L14 74 L36 68 Z" fill="currentColor" opacity="0.7" />
      {/* Pointes aile gauche */}
      <path d="M5 35 L0 24 L12 37 Z" fill="currentColor" opacity="0.6" />
      <path d="M3 42 L-2 30 L10 44 Z" fill="currentColor" opacity="0.5" />
      {/* Aile droite haute */}
      <path d="M60 55 L95 35 L86 52 L66 60 Z" fill="currentColor" opacity="0.85" />
      {/* Aile droite basse */}
      <path d="M62 63 L98 68 L86 74 L64 68 Z" fill="currentColor" opacity="0.7" />
      {/* Pointes aile droite */}
      <path d="M95 35 L100 24 L88 37 Z" fill="currentColor" opacity="0.6" />
      <path d="M97 42 L102 30 L90 44 Z" fill="currentColor" opacity="0.5" />
      {/* Queue */}
      <path d="M42 78 L36 96 L50 90 L64 96 L58 78 Z" fill="currentColor" opacity="0.8" />
      {/* Serres */}
      <path d="M44 80 L40 88 L46 86 Z" fill="currentColor" opacity="0.6" />
      <path d="M56 80 L60 88 L54 86 Z" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

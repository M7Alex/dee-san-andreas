'use client'
// Header institutionnel avec effet scan-line périodique
// Utilisé sur page.tsx ET company/[slug]/page.tsx

import { useEffect, useRef } from 'react'

export function ScanHeader({ children }: { children: React.ReactNode }) {
  const scanRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scan line déclenché toutes les 6 secondes
    const el = scanRef.current
    if (!el) return
    let timeoutId: ReturnType<typeof setTimeout>

    function runScan() {
      if (!el) return
      el.classList.remove('scan-running')
      // Force reflow pour relancer l'animation
      void el.offsetWidth
      el.classList.add('scan-running')
      timeoutId = setTimeout(runScan, 6000)
    }

    timeoutId = setTimeout(runScan, 1200) // premier scan après 1.2s
    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gold-600/10 scan-header-wrap">
      {/* Ligne de scan animée */}
      <div ref={scanRef} className="scan-line-el" aria-hidden="true" />
      {/* Ligne de status HUD en bas du header */}
      <div className="hud-status-bar" aria-hidden="true">
        <span>DEE · SAN ANDREAS</span>
        <span>SYSTÈME SÉCURISÉ</span>
        <span>ACCÈS CONTRÔLÉ</span>
      </div>
      {children}
    </header>
  )
}

'use client'
// Transition blur + fade entre les pages
// Wrap les liens vers /company/ depuis page.tsx

import { useRouter } from 'next/navigation'
import { useRef } from 'react'

export function usePageTransition() {
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement | null>(null)

  function navigateTo(href: string) {
    // Créer l'overlay si pas déjà existant
    let overlay = document.getElementById('page-transition-overlay')
    if (!overlay) {
      overlay = document.createElement('div')
      overlay.id = 'page-transition-overlay'
      overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        background: #050810;
        opacity: 0;
        pointer-events: none;
        backdrop-filter: blur(0px);
        transition: opacity 0.35s ease, backdrop-filter 0.35s ease;
      `
      document.body.appendChild(overlay)
    }
    overlayRef.current = overlay as HTMLDivElement

    // Phase 1 : fade out + blur
    overlay.style.pointerEvents = 'all'
    requestAnimationFrame(() => {
      overlay!.style.opacity = '1'
      overlay!.style.backdropFilter = 'blur(12px)'
    })

    // Phase 2 : navigate
    setTimeout(() => {
      router.push(href)
      // Phase 3 : fade in sur la nouvelle page
      setTimeout(() => {
        overlay!.style.opacity = '0'
        overlay!.style.backdropFilter = 'blur(0px)'
        setTimeout(() => {
          overlay!.style.pointerEvents = 'none'
        }, 400)
      }, 120)
    }, 350)
  }

  return { navigateTo }
}

// Composant Link avec transition
export function TransitionLink({
  href,
  children,
  className,
  style,
}: {
  href: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const { navigateTo } = usePageTransition()

  return (
    <div
      onClick={() => navigateTo(href)}
      className={className}
      style={{ cursor: 'pointer', ...style }}
    >
      {children}
    </div>
  )
}

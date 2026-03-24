'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getCompaniesByCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/companies-data'
import { ChevronDown, ExternalLink, Shield, BarChart3, FileText, Users } from 'lucide-react'

// ─── Holographic Eagle Animation ──────────────────────────────────────────────
function HoloEagle({ onComplete }: { onComplete?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = 520
    const H = 520
    canvas.width = W
    canvas.height = H

    // Eagle SVG path — inspiré du sceau présidentiel (ailes déployées, majestueux)
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="520" viewBox="0 0 520 520">
      <g fill="white">
        <!-- Corps -->
        <ellipse cx="260" cy="290" rx="52" ry="72"/>
        <!-- Tête -->
        <circle cx="260" cy="175" r="38"/>
        <!-- Bec -->
        <polygon points="260,192 292,208 260,220"/>
        <!-- Oeil -->
        <circle cx="272" cy="165" r="5" fill="black"/>
        <!-- Aile gauche haute -->
        <path d="M220,210 L30,120 L60,195 L140,230 Z"/>
        <!-- Aile gauche basse -->
        <path d="M215,235 L15,270 L70,300 L185,265 Z"/>
        <!-- Aile gauche pointes -->
        <path d="M30,120 L10,90 L55,130 Z"/>
        <path d="M50,110 L35,75 L75,118 Z"/>
        <path d="M70,100 L60,62 L95,108 Z"/>
        <!-- Aile droite haute -->
        <path d="M300,210 L490,120 L460,195 L380,230 Z"/>
        <!-- Aile droite basse -->
        <path d="M305,235 L505,270 L450,300 L335,265 Z"/>
        <!-- Aile droite pointes -->
        <path d="M490,120 L510,90 L465,130 Z"/>
        <path d="M470,110 L485,75 L445,118 Z"/>
        <path d="M450,100 L460,62 L425,108 Z"/>
        <!-- Queue -->
        <path d="M230,358 L200,455 L260,432 L320,455 L290,358 Z"/>
        <!-- Serres gauche -->
        <path d="M235,358 L205,395 L215,400 L240,368"/>
        <path d="M242,362 L220,402 L230,405 L248,372"/>
        <path d="M228,358 L195,388 L204,394 L232,368"/>
        <!-- Serres droite -->
        <path d="M285,358 L315,395 L305,400 L280,368"/>
        <path d="M278,362 L300,402 L290,405 L272,372"/>
        <path d="M292,358 L325,388 L316,394 L288,368"/>
        <!-- Bouclier (poitrail) -->
        <rect x="235" y="248" width="50" height="62" rx="4"/>
        <!-- Rayures bouclier -->
        <rect x="238" y="250" width="44" height="6" fill="rgba(0,0,0,0.3)"/>
        <rect x="238" y="260" width="44" height="6" fill="rgba(0,0,0,0.3)"/>
        <rect x="238" y="270" width="44" height="6" fill="rgba(0,0,0,0.3)"/>
        <rect x="238" y="280" width="44" height="6" fill="rgba(0,0,0,0.3)"/>
        <!-- Rameau gauche -->
        <path d="M208,355 Q180,340 160,310 Q175,325 195,330 Q172,318 165,295 Q182,312 200,318 Q180,302 178,278 Q196,298 210,305"/>
        <!-- Flèches droite -->
        <line x1="312" y1="355" x2="355" y2="300" stroke="white" stroke-width="4"/>
        <line x1="322" y1="355" x2="365" y2="300" stroke="white" stroke-width="4"/>
        <line x1="332" y1="355" x2="372" y2="305" stroke="white" stroke-width="4"/>
        <polygon points="355,300 345,308 362,312"/>
        <polygon points="365,300 355,308 372,312"/>
        <polygon points="372,305 362,313 379,317"/>
      </g>
    </svg>`

    const img = new window.Image()
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`

    img.onload = () => {
      const offscreen = document.createElement('canvas')
      offscreen.width = W
      offscreen.height = H
      const offCtx = offscreen.getContext('2d')!
      offCtx.drawImage(img, 0, 0, W, H)
      const imageData = offCtx.getImageData(0, 0, W, H)

      const eaglePoints: [number, number][] = []
      for (let y = 0; y < H; y += 4) {
        for (let x = 0; x < W; x += 4) {
          const i = (y * W + x) * 4
          if (imageData.data[i] > 60) eaglePoints.push([x, y])
        }
      }

      type Particle = {
        x: number; y: number; tx: number; ty: number
        size: number; speed: number; color: string
        phase: number; arrived: boolean; delay: number
      }

      const particles: Particle[] = eaglePoints.map(([tx, ty]) => ({
        x: W / 2 + (Math.random() - 0.5) * 60,
        y: H / 2 + (Math.random() - 0.5) * 60,
        tx, ty,
        size: Math.random() * 1.8 + 0.4,
        speed: 0.03 + Math.random() * 0.04,
        color: Math.random() > 0.6
          ? `rgba(232,181,32,${0.7 + Math.random() * 0.3})`
          : Math.random() > 0.5
            ? `rgba(180,220,255,${0.5 + Math.random() * 0.4})`
            : `rgba(255,255,255,${0.4 + Math.random() * 0.4})`,
        phase: Math.random() * Math.PI * 2,
        arrived: false,
        delay: Math.random() * 40,
      }))

      let frame = 0
      let globalAlpha = 1
      let fadeOut = false
      let animId: number
      const FORM_FRAMES = 160
      const HOLD_FRAMES = 80
      const FADE_FRAMES = 60

      function drawRing(frame: number, alpha: number) {
        const cx = W / 2, cy = H / 2
        const r = 235
        ctx.save()
        ctx.globalAlpha = alpha * 0.55

        // Anneau tournant
        const grad = ctx.createConicalGradient
          ? null
          : null

        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(232,181,32,0.3)`
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Points sur l'anneau
        for (let i = 0; i < 32; i++) {
          const angle = (i / 32) * Math.PI * 2 + frame * 0.012
          const px = cx + Math.cos(angle) * r
          const py = cy + Math.sin(angle) * r
          const bright = (Math.sin(angle * 3 + frame * 0.05) + 1) / 2
          ctx.beginPath()
          ctx.arc(px, py, bright > 0.7 ? 3 : 1.5, 0, Math.PI * 2)
          ctx.fillStyle = bright > 0.7
            ? `rgba(232,181,32,${0.9 * alpha})`
            : `rgba(200,180,100,${0.4 * alpha})`
          ctx.fill()
        }

        // Anneau intérieur contre-tournant
        const r2 = 220
        ctx.beginPath()
        ctx.arc(cx, cy, r2, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(130,200,255,0.15)`
        ctx.lineWidth = 1
        ctx.stroke()

        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2 - frame * 0.018
          const px = cx + Math.cos(angle) * r2
          const py = cy + Math.sin(angle) * r2
          ctx.beginPath()
          ctx.arc(px, py, 1.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(150,220,255,${0.6 * alpha})`
          ctx.fill()
        }

        // Lignes de scan hologramme
        if (frame % 3 === 0) {
          const scanY = cy - 230 + ((frame * 3) % 460)
          ctx.beginPath()
          ctx.moveTo(cx - 230, scanY)
          ctx.lineTo(cx + 230, scanY)
          ctx.strokeStyle = `rgba(100,200,255,0.08)`
          ctx.lineWidth = 1
          ctx.stroke()
        }

        ctx.restore()
      }

      function animate() {
        ctx.clearRect(0, 0, W, H)
        frame++

        // Phase fadeout
        if (fadeOut) {
          globalAlpha -= 1 / FADE_FRAMES
          if (globalAlpha <= 0) {
            cancelAnimationFrame(animId)
            onComplete?.()
            return
          }
        } else if (frame > FORM_FRAMES + HOLD_FRAMES) {
          fadeOut = true
        }

        ctx.save()
        ctx.globalAlpha = Math.max(0, globalAlpha)

        // Lueur centrale hologramme
        const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 260)
        grd.addColorStop(0, 'rgba(30,80,180,0.08)')
        grd.addColorStop(0.5, 'rgba(20,60,140,0.04)')
        grd.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grd
        ctx.fillRect(0, 0, W, H)

        // Particules
        for (const p of particles) {
          if (frame < p.delay) continue
          const dx = p.tx - p.x
          const dy = p.ty - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 1.5) {
            p.x += dx * p.speed
            p.y += dy * p.speed
          } else {
            p.arrived = true
          }

          const pulse = p.arrived
            ? 0.65 + 0.35 * Math.sin(frame * 0.04 + p.phase)
            : 0.9

          // Halo de lueur
          if (p.arrived && Math.random() > 0.97) {
            const glowR = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 6)
            glowR.addColorStop(0, 'rgba(232,181,32,0.6)')
            glowR.addColorStop(1, 'rgba(232,181,32,0)')
            ctx.fillStyle = glowR
            ctx.fillRect(p.x - 6, p.y - 6, 12, 12)
          }

          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.fill()
        }

        // Anneau (apparait après assemblage)
        const ringAlpha = Math.min(1, Math.max(0, (frame - FORM_FRAMES * 0.7) / 40))
        if (ringAlpha > 0) drawRing(frame, ringAlpha * globalAlpha)

        ctx.restore()

        animId = requestAnimationFrame(animate)
      }

      animate()
      return () => cancelAnimationFrame(animId)
    }
  }, [onComplete])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: 420,
        height: 420,
        filter: 'drop-shadow(0 0 40px rgba(232,181,32,0.35)) drop-shadow(0 0 80px rgba(100,160,255,0.15))',
      }}
    />
  )
}

// ─── Eagle en boucle (après chargement) ───────────────────────────────────────
function LoopEagle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = 420, H = 420
    canvas.width = W
    canvas.height = H

    let frame = 0
    let animId: number

    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420" viewBox="0 0 520 520">
      <g fill="white">
        <ellipse cx="260" cy="290" rx="52" ry="72"/>
        <circle cx="260" cy="175" r="38"/>
        <polygon points="260,192 292,208 260,220"/>
        <circle cx="272" cy="165" r="5" fill="black"/>
        <path d="M220,210 L30,120 L60,195 L140,230 Z"/>
        <path d="M215,235 L15,270 L70,300 L185,265 Z"/>
        <path d="M30,120 L10,90 L55,130 Z"/>
        <path d="M50,110 L35,75 L75,118 Z"/>
        <path d="M70,100 L60,62 L95,108 Z"/>
        <path d="M300,210 L490,120 L460,195 L380,230 Z"/>
        <path d="M305,235 L505,270 L450,300 L335,265 Z"/>
        <path d="M490,120 L510,90 L465,130 Z"/>
        <path d="M470,110 L485,75 L445,118 Z"/>
        <path d="M450,100 L460,62 L425,108 Z"/>
        <path d="M230,358 L200,455 L260,432 L320,455 L290,358 Z"/>
        <rect x="235" y="248" width="50" height="62" rx="4"/>
        <rect x="238" y="250" width="44" height="6" fill="rgba(0,0,0,0.3)"/>
        <rect x="238" y="260" width="44" height="6" fill="rgba(0,0,0,0.3)"/>
        <rect x="238" y="270" width="44" height="6" fill="rgba(0,0,0,0.3)"/>
        <rect x="238" y="280" width="44" height="6" fill="rgba(0,0,0,0.3)"/>
        <path d="M208,355 Q180,340 160,310 Q175,325 195,330 Q172,318 165,295 Q182,312 200,318 Q180,302 178,278 Q196,298 210,305"/>
        <line x1="312" y1="355" x2="355" y2="300" stroke="white" stroke-width="4"/>
        <line x1="322" y1="355" x2="365" y2="300" stroke="white" stroke-width="4"/>
        <line x1="332" y1="355" x2="372" y2="305" stroke="white" stroke-width="4"/>
        <polygon points="355,300 345,308 362,312"/>
        <polygon points="365,300 355,308 372,312"/>
        <polygon points="372,305 362,313 379,317"/>
      </g>
    </svg>`

    const img = new window.Image()
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`

    img.onload = () => {
      function draw() {
        ctx.clearRect(0, 0, W, H)
        frame++

        const cx = W / 2, cy = H / 2

        // Lueur bleue de fond
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200)
        grd.addColorStop(0, 'rgba(30,80,180,0.07)')
        grd.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grd
        ctx.fillRect(0, 0, W, H)

        // Aigle avec effet hologramme (légère oscillation alpha)
        const eagleAlpha = 0.82 + 0.12 * Math.sin(frame * 0.025)
        ctx.globalAlpha = eagleAlpha
        ctx.drawImage(img, 0, 0, W, H)
        ctx.globalAlpha = 1

        // Scan line
        const scanY = (frame * 1.8) % (H + 40) - 20
        const scanGrad = ctx.createLinearGradient(0, scanY - 3, 0, scanY + 3)
        scanGrad.addColorStop(0, 'rgba(100,200,255,0)')
        scanGrad.addColorStop(0.5, 'rgba(100,200,255,0.12)')
        scanGrad.addColorStop(1, 'rgba(100,200,255,0)')
        ctx.fillStyle = scanGrad
        ctx.fillRect(0, scanY - 3, W, 6)

        // Anneau extérieur tournant
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(frame * 0.008)
        ctx.beginPath()
        ctx.arc(0, 0, 195, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(232,181,32,0.25)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        for (let i = 0; i < 32; i++) {
          const angle = (i / 32) * Math.PI * 2
          const bright = (Math.sin(angle * 4 + frame * 0.06) + 1) / 2
          const px = Math.cos(angle) * 195
          const py = Math.sin(angle) * 195
          ctx.beginPath()
          ctx.arc(px, py, bright > 0.75 ? 2.5 : 1.2, 0, Math.PI * 2)
          ctx.fillStyle = bright > 0.75
            ? `rgba(232,181,32,0.9)`
            : `rgba(200,170,80,0.4)`
          ctx.fill()
        }
        ctx.restore()

        // Anneau intérieur contre-tournant
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(-frame * 0.012)
        ctx.beginPath()
        ctx.arc(0, 0, 180, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(130,200,255,0.12)'
        ctx.lineWidth = 1
        ctx.stroke()

        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2
          const px = Math.cos(angle) * 180
          const py = Math.sin(angle) * 180
          ctx.beginPath()
          ctx.arc(px, py, 1.5, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(150,220,255,0.55)'
          ctx.fill()
        }
        ctx.restore()

        // Petites étincelles aléatoires
        if (frame % 8 === 0) {
          const angle = Math.random() * Math.PI * 2
          const r = 160 + Math.random() * 35
          const sx = cx + Math.cos(angle) * r
          const sy = cy + Math.sin(angle) * r
          const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, 5)
          sg.addColorStop(0, 'rgba(232,181,32,0.8)')
          sg.addColorStop(1, 'rgba(232,181,32,0)')
          ctx.fillStyle = sg
          ctx.fillRect(sx - 5, sy - 5, 10, 10)
        }

        animId = requestAnimationFrame(draw)
      }
      draw()
    }

    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: 380,
        height: 380,
        filter: 'drop-shadow(0 0 30px rgba(232,181,32,0.3)) drop-shadow(0 0 60px rgba(100,160,255,0.12))',
      }}
    />
  )
}

// ─── Écran de chargement ───────────────────────────────────────────────────────
function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'assembling' | 'fading'>('assembling')

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'radial-gradient(ellipse at center, #0d1117 0%, #060a0f 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 1.2s ease',
        pointerEvents: phase === 'fading' ? 'none' : 'all',
      }}
      onTransitionEnd={() => { if (phase === 'fading') onDone() }}
    >
      {/* Particules de fond */}
      <BackgroundParticles />

      <HoloEagle onComplete={() => setPhase('fading')} />

      <div style={{
        marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
      }}>
        <div style={{
          color: 'rgba(232,181,32,0.9)', fontSize: 11,
          letterSpacing: '0.35em', textTransform: 'uppercase',
          fontFamily: 'serif', fontWeight: 500,
        }}>
          État de San Andreas
        </div>
        <div style={{
          color: 'rgba(150,180,220,0.5)', fontSize: 10,
          letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          Département Économique & Entrepreneurial
        </div>
        {/* Barre de chargement stylisée */}
        <div style={{
          marginTop: 16, width: 180, height: 2,
          background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(232,181,32,0.8), transparent)',
            animation: 'scan 2s linear infinite',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateX(-100%) }
          100% { transform: translateX(100%) }
        }
      `}</style>
    </div>
  )
}

// ─── Particules de fond animées ────────────────────────────────────────────────
function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight

    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)

    type Star = { x: number; y: number; r: number; alpha: number; speed: number; phase: number; color: string }
    const stars: Star[] = Array.from({ length: 120 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random(),
      speed: 0.008 + Math.random() * 0.015,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.8 ? 'rgba(232,181,32,' : Math.random() > 0.5 ? 'rgba(130,180,255,' : 'rgba(255,255,255,',
    }))

    // Quelques blobs lumineux flottants
    type Blob = { x: number; y: number; r: number; color: string; vx: number; vy: number }
    const blobs: Blob[] = [
      { x: W * 0.2, y: H * 0.3, r: 300, color: 'rgba(20,50,120,0.06)', vx: 0.12, vy: 0.08 },
      { x: W * 0.8, y: H * 0.7, r: 250, color: 'rgba(100,60,20,0.05)', vx: -0.10, vy: -0.06 },
      { x: W * 0.5, y: H * 0.8, r: 200, color: 'rgba(15,40,90,0.05)', vx: 0.06, vy: -0.12 },
    ]

    let frame = 0, animId: number

    function draw() {
      ctx.clearRect(0, 0, W, H)
      frame++

      // Blobs flottants
      for (const b of blobs) {
        b.x += b.vx; b.y += b.vy
        if (b.x < -b.r || b.x > W + b.r) b.vx *= -1
        if (b.y < -b.r || b.y > H + b.r) b.vy *= -1
        const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        grd.addColorStop(0, b.color)
        grd.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grd
        ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2)
      }

      // Étoiles scintillantes
      for (const s of stars) {
        const a = (Math.sin(frame * s.speed + s.phase) + 1) / 2 * 0.7 + 0.05
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = s.color + a + ')'
        ctx.fill()
      }

      // Lignes horizontales très légères
      for (let i = 0; i < 6; i++) {
        const y = (H * i / 6 + frame * 0.15) % H
        const a = 0.02 + 0.01 * Math.sin(frame * 0.02 + i)
        const g = ctx.createLinearGradient(0, y, W, y)
        g.addColorStop(0, 'rgba(232,181,32,0)')
        g.addColorStop(0.5, `rgba(232,181,32,${a})`)
        g.addColorStop(1, 'rgba(232,181,32,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, y, W, 1)
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  )
}

// ─── Navigation Menu ──────────────────────────────────────────────────────────
function NavMenu() {
  const [open, setOpen] = useState<string | null>(null)
  const groups = getCompaniesByCategory()

  return (
    <nav className="relative z-50">
      <div className="flex items-center gap-1 flex-wrap justify-center">
        {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
          <div
            key={cat}
            className="relative"
            onMouseEnter={() => setOpen(cat)}
            onMouseLeave={() => setOpen(null)}
          >
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-stone-300 hover:text-gold-400 hover:bg-gov-600 transition-all duration-200">
              <span>{CATEGORY_ICONS[cat]}</span>
              <span>{label}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {open === cat && (
              <div className="absolute top-full left-0 mt-1 w-56 glass rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 border border-gold-600/20">
                <div className="p-1">
                  {(groups[cat] || []).map((company) => (
                    <Link
                      key={company.slug}
                      href={`/company/${company.slug}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-300 hover:text-white hover:bg-gov-500 transition-all duration-150 group"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0 transition-all group-hover:scale-125"
                        style={{ backgroundColor: company.accentColor }}
                      />
                      {company.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)

  const handleLoadDone = () => {
    setLoading(false)
    setTimeout(() => setLoaded(true), 100)
  }

  return (
    <>
      {loading && <LoadingScreen onDone={handleLoadDone} />}

      <main className="min-h-screen bg-gov-900 overflow-x-hidden" style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.8s ease' }}>
        {/* Fond animé de la page principale */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <BackgroundParticles />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-gold-600/3 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-900/8 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-900/8 blur-3xl" />
        </div>

        {/* ── Top Bar ── */}
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gold-600/10">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
                <span className="text-gold-400 text-xs font-bold">SA</span>
              </div>
              <span className="font-serif text-gold-400 text-sm font-medium hidden sm:block">
                État de San Andreas
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-stone-400 hover:text-gold-400 transition-colors px-4 py-1.5 rounded-lg hover:bg-gov-700"
              >
                Connexion Admin
              </Link>
            </div>
          </div>
        </header>

        {/* ── Hero Section ── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 z-10">
          <div
            className="relative z-10 flex flex-col items-center text-center"
            style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(24px)', transition: 'all 1s ease' }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-600/30 bg-gold-900/10 text-gold-400 text-xs font-medium tracking-widest uppercase mb-8">
              <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse" />
              Plateforme Officielle
            </div>

            {/* Eagle en boucle */}
            <div className="mb-6">
              <LoopEagle />
            </div>

            {/* Title */}
            <h1 className="font-serif text-5xl md:text-7xl font-bold mb-3 leading-tight">
              <span className="text-gold-gradient">Département Économique</span>
              <br />
              <span className="text-white">& Entrepreneurial</span>
            </h1>

            <div className="divider-ornament w-64 my-6">
              <span className="text-gold-400 text-xs tracking-[0.3em] uppercase font-medium">
                État de San Andreas
              </span>
            </div>

            <p className="text-stone-400 text-lg max-w-2xl leading-relaxed mb-10">
              Plateforme gouvernementale de gestion économique, entrepreneuriale et administrative
              de l'État de San Andreas. Accédez aux outils, documents et ressources officiels.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link
                href="/login"
                className="btn-gold px-8 py-3 rounded-xl font-semibold text-sm tracking-wide shadow-lg shadow-gold-600/20"
              >
                Accès Administration
              </Link>
              <a
                href="#entreprises"
                className="px-8 py-3 rounded-xl font-semibold text-sm tracking-wide border border-stone-700 text-stone-300 hover:border-gold-600/40 hover:text-gold-400 transition-all"
              >
                Voir les entreprises
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
              {[
                { icon: <Shield className="w-5 h-5" />, value: '5', label: 'Catégories' },
                { icon: <BarChart3 className="w-5 h-5" />, value: '60+', label: 'Entreprises' },
                { icon: <FileText className="w-5 h-5" />, value: '5', label: 'Types de dossiers' },
                { icon: <Users className="w-5 h-5" />, value: '4', label: "Niveaux d'accès" },
              ].map((s) => (
                <div key={s.label} className="glass rounded-xl p-4 text-center">
                  <div className="text-gold-400 flex justify-center mb-2">{s.icon}</div>
                  <div className="font-serif text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-stone-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40 z-10">
            <ChevronDown className="w-5 h-5 text-gold-400" />
          </div>
        </section>

        {/* ── Navigation ── */}
        <section className="sticky top-16 z-40 glass border-y border-gold-600/10 py-3">
          <div className="max-w-7xl mx-auto px-6">
            <NavMenu />
          </div>
        </section>

        {/* ── Companies Grid ── */}
        <section id="entreprises" className="py-24 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
              const groups = getCompaniesByCategory()
              const companies = groups[cat] || []
              return (
                <div key={cat} className="mb-16">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-3xl">{CATEGORY_ICONS[cat]}</span>
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-white">{label}</h2>
                      <p className="text-stone-500 text-sm">{companies.length} entités</p>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-gold-600/20 to-transparent ml-4" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {companies.map((company) => (
                      <Link
                        key={company.slug}
                        href={`/company/${company.slug}`}
                        className="group relative rounded-xl overflow-hidden border border-transparent hover:border-gold-600/30 transition-all duration-300"
                        style={{ background: company.color }}
                      >
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: `radial-gradient(circle at 50% 0%, ${company.accentColor}20, transparent 70%)` }}
                        />
                        <div className="p-4 relative z-10">
                          <div className="w-2 h-2 rounded-full mb-3" style={{ backgroundColor: company.accentColor }} />
                          <div className="font-medium text-sm text-stone-200 group-hover:text-white transition-colors leading-tight">
                            {company.name}
                          </div>
                          {company.description && (
                            <div className="text-xs text-stone-500 mt-1 leading-tight line-clamp-2">{company.description}</div>
                          )}
                          <ExternalLink className="w-3 h-3 text-stone-600 group-hover:text-gold-400 mt-2 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-stone-800 py-8 px-6 relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full border border-gold-600/40 flex items-center justify-center">
                <span className="text-gold-500 text-xs font-bold">SA</span>
              </div>
              <div>
                <div className="text-gold-400 text-sm font-medium">Département Économique & Entrepreneurial</div>
                <div className="text-stone-600 text-xs">État de San Andreas — Plateforme Officielle</div>
              </div>
            </div>
            <div className="text-stone-700 text-xs">
              © {new Date().getFullYear()} — Système d'information gouvernemental. Usage interne uniquement.
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}

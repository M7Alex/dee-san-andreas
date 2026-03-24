'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getCompaniesByCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/companies-data'
import { ChevronDown, ExternalLink, Shield, BarChart3, FileText, Users } from 'lucide-react'

// ─── Loading Screen ───────────────────────────────────────────────────────────
function LoadingScreen({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width = 400
    const H = canvas.height = 400

    const particles: { x: number; y: number; tx: number; ty: number; speed: number; size: number; color: string; arrived: boolean; phase: number }[] = []

    // Points de l'aigle
    const points: [number, number][] = []
    for (let y = 60; y < 380; y += 6) {
      for (let x = 40; x < 360; x += 6) {
        const cx = x - 200, cy = y - 220
        // Corps
        if (cx * cx / 2500 + cy * cy / 6000 < 1) points.push([x, y])
        // Tête
        if ((cx - 0) ** 2 / 900 + (cy + 110) ** 2 / 900 < 1) points.push([x, y])
        // Aile gauche
        if (cx < -20 && cy > -80 && cy < 80 && cx > -160 - cy * 0.5) points.push([x, y])
        // Aile droite
        if (cx > 20 && cy > -80 && cy < 80 && cx < 160 + cy * 0.5) points.push([x, y])
      }
    }

    for (const [tx, ty] of points) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        tx, ty,
        speed: 0.05 + Math.random() * 0.04,
        size: Math.random() * 2.5 + 0.5,
        color: Math.random() > 0.6
          ? `rgba(245,200,66,${0.7 + Math.random() * 0.3})`
          : `rgba(210,180,120,${0.4 + Math.random() * 0.4})`,
        arrived: false,
        phase: Math.random() * Math.PI * 2,
      })
    }

    let frame = 0
    let animId: number

    function draw() {
      ctx.clearRect(0, 0, W, H)
      frame++
      let done = true

      for (const p of particles) {
        const dx = p.tx - p.x
        const dy = p.ty - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 1.5) {
          p.x += dx * p.speed
          p.y += dy * p.speed
          done = false
        } else {
          p.arrived = true
        }
        const glow = p.arrived ? 0.6 + 0.4 * Math.sin(frame * 0.04 + p.phase) : 1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * glow, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
      }

      if (!done || frame < 120) {
        animId = requestAnimationFrame(draw)
      } else {
        setTimeout(onDone, 600)
      }
    }

    animId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animId)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gov-900"
      style={{ background: 'radial-gradient(ellipse at center, #0d1228 0%, #050810 100%)' }}>
      {/* Particules de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-gold-500 opacity-10 animate-pulse-slow"
            style={{
              width: Math.random() * 4 + 1,
              height: Math.random() * 4 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }} />
        ))}
      </div>

      <canvas ref={canvasRef}
        className="relative z-10"
        style={{ filter: 'drop-shadow(0 0 40px rgba(232,181,32,0.4))' }} />

      <div className="relative z-10 text-center mt-4">
        <div className="font-serif text-gold-400 text-xl font-semibold tracking-widest">
          État de San Andreas
        </div>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Eagle Canvas (hero, boucle infinie) ─────────────────────────────────────
function EagleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width = 500
    const H = canvas.height = 420

    const particles: { x: number; tx: number; ty: number; size: number; color: string; phase: number; speed: number; floatAmp: number }[] = []

    const points: [number, number][] = []
    for (let y = 50; y < 380; y += 5) {
      for (let x = 30; x < 470; x += 5) {
        const cx = x - 250, cy = y - 210
        if (cx * cx / 2800 + cy * cy / 6500 < 1) points.push([x, y])
        if ((cx) ** 2 / 1000 + (cy + 115) ** 2 / 1000 < 1) points.push([x, y])
        if (cx < -20 && cy > -90 && cy < 90 && cx > -180 - cy * 0.4) points.push([x, y])
        if (cx > 20 && cy > -90 && cy < 90 && cx < 180 + cy * 0.4) points.push([x, y])
      }
    }

    for (const [tx, ty] of points) {
      particles.push({
        x: tx,
        tx, ty,
        size: Math.random() * 2.2 + 0.4,
        color: Math.random() > 0.65
          ? `rgba(245,200,66,${0.6 + Math.random() * 0.4})`
          : `rgba(210,185,130,${0.35 + Math.random() * 0.4})`,
        phase: Math.random() * Math.PI * 2,
        speed: 0.015 + Math.random() * 0.02,
        floatAmp: Math.random() * 4 + 1,
      })
    }

    let frame = 0
    let animId: number

    function draw() {
      ctx.clearRect(0, 0, W, H)
      frame++

      for (const p of particles) {
        // Flottement doux permanent
        const floatY = p.ty + Math.sin(frame * p.speed + p.phase) * p.floatAmp
        const floatX = p.tx + Math.cos(frame * p.speed * 0.7 + p.phase) * (p.floatAmp * 0.3)
        const glow = 0.6 + 0.4 * Math.sin(frame * 0.025 + p.phase)

        ctx.beginPath()
        ctx.arc(floatX, floatY, p.size * glow, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas ref={canvasRef} className="opacity-90 select-none"
      style={{ filter: 'drop-shadow(0 0 30px rgba(232,181,32,0.3))' }} />
  )
}

// ─── Animated Background ──────────────────────────────────────────────────────
function AnimatedBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Orbes flottants */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-5 animate-float"
        style={{ background: 'radial-gradient(circle, #e8b520 0%, transparent 70%)' }} />
      <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full opacity-8 animate-float"
        style={{ background: 'radial-gradient(circle, #1e40af 0%, transparent 70%)', animationDelay: '2s' }} />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-8 animate-float"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', animationDelay: '4s' }} />

      {/* Lignes horizontales animées */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="absolute w-full h-px"
          style={{
            top: `${8 + i * 8}%`,
            background: 'linear-gradient(90deg, transparent 0%, rgba(232,181,32,0.15) 50%, transparent 100%)',
            animation: `shimmer ${3 + i * 0.3}s linear infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
      ))}

      {/* Particules flottantes */}
      {Array.from({ length: 25 }).map((_, i) => (
        <div key={i} className="absolute rounded-full bg-gold-400 animate-float"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.1 + Math.random() * 0.15,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${4 + Math.random() * 4}s`,
          }} />
      ))}
    </div>
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
          <div key={cat} className="relative"
            onMouseEnter={() => setOpen(cat)}
            onMouseLeave={() => setOpen(null)}>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-stone-300 hover:text-gold-400 hover:bg-gov-600 transition-all duration-200">
              <span>{CATEGORY_ICONS[cat]}</span>
              <span>{label}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {open === cat && (
              <div className="absolute top-full left-0 mt-1 w-56 glass rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 border border-gold-600/20">
                <div className="p-1">
                  {(groups[cat] || []).map((company) => (
                    <Link key={company.slug} href={`/company/${company.slug}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-stone-300 hover:text-white hover:bg-gov-500 transition-all duration-150 group">
                      <span className="w-2 h-2 rounded-full flex-shrink-0 transition-all group-hover:scale-125"
                        style={{ backgroundColor: company.accentColor }} />
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
  const [showLoading, setShowLoading] = useState(true)
  const [visible, setVisible] = useState(false)

  function handleLoadingDone() {
    setShowLoading(false)
    setTimeout(() => setVisible(true), 100)
  }

  return (
    <main className="min-h-screen bg-gov-900 overflow-x-hidden">
      {/* Loading screen */}
      {showLoading && <LoadingScreen onDone={handleLoadingDone} />}

      {/* Contenu principal */}
      <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease' }}>
        {/* Background animé */}
        <AnimatedBg />

        {/* Top Bar */}
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gold-600/10">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
                <span className="text-gold-400 text-xs font-bold">SA</span>
              </div>
              <span className="font-serif text-gold-400 text-sm font-medium hidden sm:block">État de San Andreas</span>
            </div>
            <Link href="/login" className="text-sm text-stone-400 hover:text-gold-400 transition-colors px-4 py-1.5 rounded-lg hover:bg-gov-700">
              Connexion Admin
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-600/30 bg-gold-900/10 text-gold-400 text-xs font-medium tracking-widest uppercase mb-8">
              <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse" />
              Plateforme Officielle
            </div>

            <EagleCanvas />

            <h1 className="font-serif text-5xl md:text-7xl font-bold mb-3 leading-tight">
              <span className="text-gold-gradient">Département Économique</span>
              <br />
              <span className="text-white">& Entrepreneurial</span>
            </h1>

            <div className="divider-ornament w-64 my-6">
              <span className="text-gold-400 text-xs tracking-[0.3em] uppercase font-medium">État de San Andreas</span>
            </div>

            <p className="text-stone-400 text-lg max-w-2xl leading-relaxed mb-10">
              Plateforme gouvernementale de gestion économique, entrepreneuriale et administrative de l'État de San Andreas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link href="/login" className="btn-gold px-8 py-3 rounded-xl font-semibold text-sm tracking-wide shadow-lg shadow-gold-600/20">
                Accès Administration
              </Link>
              <a href="#entreprises" className="px-8 py-3 rounded-xl font-semibold text-sm tracking-wide border border-stone-700 text-stone-300 hover:border-gold-600/40 hover:text-gold-400 transition-all">
                Voir les entreprises
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
              {[
                { icon: <Shield className="w-5 h-5" />, value: '5', label: 'Catégories' },
                { icon: <BarChart3 className="w-5 h-5" />, value: '60+', label: 'Entreprises' },
                { icon: <FileText className="w-5 h-5" />, value: '5', label: 'Types de dossiers' },
                { icon: <Users className="w-5 h-5" />, value: '3', label: "Niveaux d'accès" },
              ].map((s) => (
                <div key={s.label} className="glass rounded-xl p-4 text-center">
                  <div className="text-gold-400 flex justify-center mb-2">{s.icon}</div>
                  <div className="font-serif text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-stone-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
            <ChevronDown className="w-5 h-5 text-gold-400" />
          </div>
        </section>

        {/* Navigation sticky */}
        <section className="sticky top-16 z-40 glass border-y border-gold-600/10 py-3">
          <div className="max-w-7xl mx-auto px-6"><NavMenu /></div>
        </section>

        {/* Grille entreprises */}
        <section id="entreprises" className="py-24 px-6">
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
                      <Link key={company.slug} href={`/company/${company.slug}`}
                        className="group relative rounded-xl overflow-hidden border border-transparent hover:border-gold-600/30 transition-all duration-300"
                        style={{ background: company.color }}>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: `radial-gradient(circle at 50% 0%, ${company.accentColor}20, transparent 70%)` }} />
                        <div className="p-4 relative z-10">
                          <div className="w-2 h-2 rounded-full mb-3" style={{ backgroundColor: company.accentColor }} />
                          <div className="font-medium text-sm text-stone-200 group-hover:text-white transition-colors leading-tight">{company.name}</div>
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

        {/* Footer */}
        <footer className="border-t border-stone-800 py-8 px-6">
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
            <div className="text-stone-700 text-xs">© {new Date().getFullYear()} — Système d'information gouvernemental.</div>
          </div>
        </footer>
      </div>
    </main>
  )
}

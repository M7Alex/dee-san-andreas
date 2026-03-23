'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { getCompaniesByCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/companies-data'
import { ChevronDown, ExternalLink, Shield, BarChart3, FileText, Users } from 'lucide-react'

// ─── Eagle Particle Animation ─────────────────────────────────────────────────
function EagleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const W = canvas.width = 600
    const H = canvas.height = 500

    // Eagle shape as SVG path points (simplified silhouette)
    const eaglePoints: [number, number][] = []
    const img = new Image()
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="500" viewBox="0 0 600 500">
        <g fill="white">
          <!-- Body -->
          <ellipse cx="300" cy="280" rx="70" ry="90"/>
          <!-- Head -->
          <circle cx="300" cy="165" r="45"/>
          <!-- Beak -->
          <polygon points="300,185 330,205 300,215"/>
          <!-- Left wing -->
          <path d="M240,220 L60,160 L80,240 L180,260 Z"/>
          <path d="M240,240 L40,280 L100,300 L200,270 Z"/>
          <!-- Right wing -->
          <path d="M360,220 L540,160 L520,240 L420,260 Z"/>
          <path d="M360,240 L560,280 L500,300 L400,270 Z"/>
          <!-- Tail -->
          <path d="M270,360 L240,440 L300,420 L360,440 L330,360 Z"/>
          <!-- Talons left -->
          <path d="M265,365 L230,400 L240,405 L265,375"/>
          <path d="M270,368 L250,410 L260,412 L275,378"/>
          <!-- Talons right -->
          <path d="M335,365 L370,400 L360,405 L335,375"/>
          <path d="M330,368 L350,410 L340,412 L325,378"/>
          <!-- Eye -->
          <circle cx="310" cy="155" r="6" fill="black"/>
        </g>
      </svg>
    `)}`

    img.onload = () => {
      // Draw eagle to offscreen canvas to sample points
      const offscreen = document.createElement('canvas')
      offscreen.width = W
      offscreen.height = H
      const offCtx = offscreen.getContext('2d')!
      offCtx.drawImage(img, 0, 0, W, H)
      const imageData = offCtx.getImageData(0, 0, W, H)

      // Sample points from white pixels
      for (let y = 0; y < H; y += 5) {
        for (let x = 0; x < W; x += 5) {
          const i = (y * W + x) * 4
          if (imageData.data[i] > 128) {
            eaglePoints.push([x, y])
          }
        }
      }

      // Create particles
      const particles = eaglePoints.map(([tx, ty]) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        tx,
        ty,
        size: Math.random() * 2 + 0.5,
        speed: 0.04 + Math.random() * 0.03,
        color: Math.random() > 0.7
          ? `rgba(245,200,66,${0.6 + Math.random() * 0.4})`
          : `rgba(220,200,150,${0.4 + Math.random() * 0.4})`,
        phase: Math.random() * Math.PI * 2,
        arrived: false,
      }))

      let frame = 0
      let animationId: number

      function animate() {
        ctx.clearRect(0, 0, W, H)
        frame++

        let allArrived = true
        for (const p of particles) {
          const dx = p.tx - p.x
          const dy = p.ty - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist > 1) {
            p.x += dx * p.speed
            p.y += dy * p.speed
            allArrived = false
          } else {
            p.arrived = true
          }

          // Subtle glow pulse when arrived
          const glowPulse = p.arrived
            ? 0.7 + 0.3 * Math.sin(frame * 0.03 + p.phase)
            : 1

          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * glowPulse, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.fill()
        }

        if (!allArrived || frame < 200) {
          animationId = requestAnimationFrame(animate)
        }
      }

      animate()
      return () => cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="opacity-90 select-none"
      style={{ filter: 'drop-shadow(0 0 30px rgba(232,181,32,0.3))' }}
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
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <main className="min-h-screen bg-gov-900 overflow-x-hidden">
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
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gold-600/4 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-blue-900/10 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-indigo-900/10 blur-3xl" />
          {/* Horizontal lines */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-px opacity-5"
              style={{ top: `${12 + i * 10}%`, background: 'linear-gradient(90deg, transparent 0%, rgba(232,181,32,0.5) 50%, transparent 100%)' }}
            />
          ))}
        </div>

        <div
          className="relative z-10 flex flex-col items-center text-center"
          style={{ opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)', transition: 'all 1s ease' }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-600/30 bg-gold-900/10 text-gold-400 text-xs font-medium tracking-widest uppercase mb-8">
            <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse" />
            Plateforme Officielle
          </div>

          {/* Eagle Animation */}
          <div className="mb-8">
            <EagleCanvas />
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
              { icon: <Users className="w-5 h-5" />, value: '3', label: 'Niveaux d\'accès' },
            ].map((s) => (
              <div key={s.label} className="glass rounded-xl p-4 text-center">
                <div className="text-gold-400 flex justify-center mb-2">{s.icon}</div>
                <div className="font-serif text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-stone-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
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
                    <Link
                      key={company.slug}
                      href={`/company/${company.slug}`}
                      className="group relative rounded-xl overflow-hidden border border-transparent hover:border-gold-600/30 transition-all duration-300"
                      style={{ background: company.color }}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: `radial-gradient(circle at 50% 0%, ${company.accentColor}20, transparent 70%)` }}
                      />
                      <div className="p-4 relative z-10">
                        <div
                          className="w-2 h-2 rounded-full mb-3"
                          style={{ backgroundColor: company.accentColor }}
                        />
                        <div className="font-medium text-sm text-stone-200 group-hover:text-white transition-colors leading-tight">
                          {company.name}
                        </div>
                        {company.description && (
                          <div className="text-xs text-stone-500 mt-1 leading-tight line-clamp-2">
                            {company.description}
                          </div>
                        )}
                        <ExternalLink
                          className="w-3 h-3 text-stone-600 group-hover:text-gold-400 mt-2 transition-colors"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Recruitment Section ── */}
      <section className="py-24 px-6 border-t border-gold-600/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="divider-ornament mb-8">
            <span className="text-gold-400 text-xs tracking-widest uppercase">Recrutement</span>
          </div>
          <h2 className="font-serif text-4xl font-bold text-white mb-4">
            Rejoindre le Département
          </h2>
          <p className="text-stone-400 text-lg mb-10 leading-relaxed">
            Le Département Économique & Entrepreneurial recrute des profils motivés pour renforcer
            son équipe gouvernementale. Consultez nos offres et rejoignez l'administration de
            l'État de San Andreas.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              { title: 'Candidature générale', desc: 'Rejoindre le DEE', href: 'https://discord.gg/VOTRE-LIEN' },
              { title: 'Offres de stage', desc: 'Programmes de formation', href: 'https://discord.gg/VOTRE-LIEN' },
              { title: 'Partenariats', desc: 'Collaboration inter-agences', href: 'https://discord.gg/VOTRE-LIEN' },
            ].map((item) => (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="glass glass-hover rounded-xl p-6 text-left group"
              >
                <div className="text-gold-400 font-semibold mb-2 group-hover:text-gold-300">{item.title}</div>
                <div className="text-stone-500 text-sm mb-4">{item.desc}</div>
                <div className="flex items-center gap-2 text-xs text-stone-600 group-hover:text-gold-500 transition-colors">
                  <span>Discord</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
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
          <div className="text-stone-700 text-xs">
            © {new Date().getFullYear()} — Système d'information gouvernemental. Usage interne uniquement.
          </div>
        </div>
      </footer>
    </main>
  )
}

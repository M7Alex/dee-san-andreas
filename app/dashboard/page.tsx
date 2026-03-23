'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, FileText, Building2, Shield, Key,
  ScrollText, LogOut, Search, Upload, Trash2, Clock,
  TrendingUp, Users, AlertTriangle, CheckCircle, ChevronRight,
  RefreshCw, Loader2, Eye, EyeOff, Copy, Check
} from 'lucide-react'
import { ActivityLog, Company } from '@/types'
import { CATEGORY_LABELS, CATEGORY_ICONS, COMPANIES } from '@/lib/companies-data'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

// ─── Log Action Labels ────────────────────────────────────────────────────────
const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  LOGIN_SUCCESS: { label: 'Connexion', color: 'text-green-400', icon: '🔓' },
  LOGIN_FAILED: { label: 'Échec connexion', color: 'text-red-400', icon: '🚫' },
  COMPANY_ACCESS: { label: 'Accès entreprise', color: 'text-blue-400', icon: '🏢' },
  FILE_UPLOAD: { label: 'Upload fichier', color: 'text-gold-400', icon: '📤' },
  FILE_DELETE: { label: 'Suppression', color: 'text-red-400', icon: '🗑️' },
  FILE_PIN: { label: 'Épinglage', color: 'text-amber-400', icon: '📌' },
  FILE_UNPIN: { label: 'Désépinglage', color: 'text-stone-400', icon: '📌' },
  PIN_REGENERATED: { label: 'PIN régénéré', color: 'text-purple-400', icon: '🔑' },
  ADMIN_CREATED: { label: 'Admin créé', color: 'text-emerald-400', icon: '👤' },
  COMPANY_CREATED: { label: 'Entreprise créée', color: 'text-cyan-400', icon: '🏗️' },
}

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────
function SidebarNav({ active, role }: { active: string; role: string }) {
  const isSuperAdmin = role === 'superadmin'
  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'companies', label: 'Entreprises', icon: <Building2 className="w-4 h-4" /> },
    { id: 'logs', label: 'Journaux', icon: <ScrollText className="w-4 h-4" /> },
    ...(isSuperAdmin ? [{ id: 'pins', label: 'Gestion PINs', icon: <Key className="w-4 h-4" /> }] : []),
  ]

  return (
    <aside className="w-64 flex-shrink-0 glass border-r border-white/5 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
            <span className="text-gold-400 text-sm font-bold font-serif">SA</span>
          </div>
          <div>
            <div className="text-white font-medium text-sm font-serif">DEE</div>
            <div className="text-stone-600 text-xs">Administration</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={`/dashboard?tab=${item.id}`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              active === item.id
                ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-2 mb-3 px-3">
          <Shield className="w-3.5 h-3.5 text-gold-400" />
          <span className="text-xs text-stone-500 capitalize">{role}</span>
        </div>
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/'
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-stone-500 hover:text-red-400 hover:bg-red-950/20 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string
  icon: React.ReactNode; color: string
}) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} bg-opacity-10`}
          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <span className={color}>{icon}</span>
        </div>
      </div>
      <div className="text-2xl font-bold font-serif text-white mb-0.5">{value}</div>
      <div className="text-sm text-stone-400">{label}</div>
      {sub && <div className="text-xs text-stone-600 mt-1">{sub}</div>}
    </div>
  )
}

// ─── PIN Manager ──────────────────────────────────────────────────────────────
function PinManager() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [revealedPins, setRevealedPins] = useState<Record<string, string>>({})
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/companies/list')
      .then(r => r.json())
      .then(setCompanies)
      .finally(() => setLoading(false))
  }, [])

  async function regeneratePin(companyId: string) {
    setRegenerating(companyId)
    const res = await fetch('/api/admin/pins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId }),
    })
    const data = await res.json()
    if (data.pin) {
      setRevealedPins(prev => ({ ...prev, [companyId]: data.pin }))
    }
    setRegenerating(null)
  }

  function copyPin(companyId: string, pin: string) {
    navigator.clipboard.writeText(pin)
    setCopied(companyId)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-400 w-6 h-6" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une entreprise..."
            className="w-full pl-10 pr-4 py-2.5 bg-gov-800 border border-stone-700 rounded-xl text-sm text-white outline-none focus:border-stone-600"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(company => {
          const pin = revealedPins[company.id]
          return (
            <div key={company.id} className="glass rounded-xl p-4 border border-white/5 flex items-center gap-4">
              <div className="w-2 h-8 rounded-full" style={{ backgroundColor: COMPANIES.find(c => c.slug === company.slug)?.accentColor || '#888' }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{company.name}</div>
                <div className="text-xs text-stone-600 capitalize">{CATEGORY_LABELS[company.category] || company.category}</div>
              </div>
              <div className="flex items-center gap-2">
                {pin ? (
                  <div className="flex items-center gap-2 bg-gov-700 rounded-lg px-3 py-1.5">
                    <span className="font-mono text-gold-400 font-bold tracking-widest">{pin}</span>
                    <button onClick={() => copyPin(company.id, pin)}>
                      {copied === company.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-gov-700 rounded-lg px-3 py-1.5">
                    <span className="font-mono text-stone-600 tracking-widest">••••</span>
                  </div>
                )}
                <button
                  onClick={() => regeneratePin(company.id)}
                  disabled={regenerating === company.id}
                  className="p-2 rounded-lg bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition-all disabled:opacity-40"
                  title="Régénérer le PIN"
                >
                  {regenerating === company.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <RefreshCw className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Logs View ────────────────────────────────────────────────────────────────
function LogsView() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/logs?limit=200')
      .then(r => r.json())
      .then(setLogs)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-400 w-6 h-6" /></div>

  return (
    <div className="space-y-2">
      {logs.map(log => {
        const meta = ACTION_LABELS[log.action] || { label: log.action, color: 'text-stone-400', icon: '📋' }
        return (
          <div key={log.id} className="flex items-start gap-4 glass rounded-xl px-4 py-3 border border-white/5">
            <span className="text-lg flex-shrink-0 mt-0.5">{meta.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                {log.companyName && (
                  <span className="text-xs text-stone-500 bg-gov-700 px-2 py-0.5 rounded-full">{log.companyName}</span>
                )}
                {log.fileName && (
                  <span className="text-xs text-stone-600 truncate max-w-32">{log.fileName}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-stone-600">{log.userLabel}</span>
                {log.ip && <span className="text-xs text-stone-700 font-mono">{log.ip}</span>}
              </div>
            </div>
            <div className="text-xs text-stone-600 flex-shrink-0 text-right">
              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: fr })}
            </div>
          </div>
        )
      })}
      {logs.length === 0 && (
        <div className="text-center py-20 text-stone-600">
          <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun journal disponible</p>
        </div>
      )}
    </div>
  )
}

// ─── Companies List ───────────────────────────────────────────────────────────
function CompaniesList() {
  const [search, setSearch] = useState('')
  const groups = Object.entries(CATEGORY_LABELS)

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="w-full pl-10 pr-4 py-2.5 bg-gov-800 border border-stone-700 rounded-xl text-sm text-white outline-none focus:border-stone-600"
        />
      </div>

      {groups.map(([cat, label]) => {
        const companies = COMPANIES.filter(c =>
          c.category === cat &&
          c.name.toLowerCase().includes(search.toLowerCase())
        )
        if (!companies.length) return null
        return (
          <div key={cat}>
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>{CATEGORY_ICONS[cat]}</span> {label}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {companies.map(c => (
                <Link
                  key={c.slug}
                  href={`/company/${c.slug}`}
                  className="flex items-center gap-3 glass rounded-xl px-4 py-3 border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.accentColor }} />
                  <span className="text-sm text-stone-300 group-hover:text-white transition-colors">{c.name}</span>
                  <ChevronRight className="w-4 h-4 text-stone-700 ml-auto group-hover:text-stone-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Dashboard Home ───────────────────────────────────────────────────────────
function DashboardHome({ stats }: { stats: Record<string, unknown> | null }) {
  if (!stats) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-400 w-6 h-6" /></div>

  const recentLogs = (stats.recentLogs as ActivityLog[]) || []
  const recentFiles = (stats.recentFiles as Array<{ id: string; name: string; companySlug: string; uploadedAt: string; size: number }>) || []

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Fichiers totaux" value={stats.totalFiles as number} icon={<FileText className="w-5 h-5" />} color="text-blue-400" />
        <StatCard label="Entreprises actives" value={stats.totalCompanies as number} icon={<Building2 className="w-5 h-5" />} color="text-green-400" />
        <StatCard label="Administrateurs" value={stats.totalAdmins as number} icon={<Shield className="w-5 h-5" />} color="text-gold-400" />
        <StatCard label="Actions récentes" value={recentLogs.length} icon={<ScrollText className="w-5 h-5" />} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 text-gold-400" /> Derniers fichiers
          </h3>
          <div className="space-y-2">
            {recentFiles.slice(0, 6).map((f) => (
              <div key={f.id} className="flex items-center gap-3 text-sm">
                <FileText className="w-4 h-4 text-stone-600 flex-shrink-0" />
                <span className="text-stone-300 truncate flex-1">{f.name}</span>
                <span className="text-xs text-stone-600 flex-shrink-0">{f.companySlug}</span>
              </div>
            ))}
            {recentFiles.length === 0 && <p className="text-stone-600 text-sm text-center py-4">Aucun fichier</p>}
          </div>
        </div>

        {/* Recent Logs */}
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold-400" /> Activité récente
          </h3>
          <div className="space-y-2">
            {recentLogs.slice(0, 6).map((log) => {
              const meta = ACTION_LABELS[log.action] || { label: log.action, color: 'text-stone-400', icon: '📋' }
              return (
                <div key={log.id} className="flex items-center gap-3 text-sm">
                  <span className="text-base flex-shrink-0">{meta.icon}</span>
                  <span className={`flex-1 ${meta.color}`}>{meta.label}</span>
                  <span className="text-xs text-stone-600 flex-shrink-0">{log.userLabel}</span>
                </div>
              )
            })}
            {recentLogs.length === 0 && <p className="text-stone-600 text-sm text-center py-4">Aucune activité</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState('dashboard')
  const [role, setRole] = useState('')
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Check search params for tab
  useEffect(() => {
    const url = new URL(window.location.href)
    const t = url.searchParams.get('tab')
    if (t) setTab(t)
  }, [])

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated || d.session.role === 'company') {
        router.push('/login')
        return
      }
      setRole(d.session.role)
      setCheckingAuth(false)
    })
  }, [router])

  useEffect(() => {
    if (tab === 'dashboard') {
      fetch('/api/admin/stats').then(r => r.json()).then(setStats)
    }
  }, [tab])

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gov-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
      </div>
    )
  }

  const TAB_TITLES: Record<string, string> = {
    dashboard: 'Tableau de bord',
    companies: 'Entreprises',
    logs: 'Journaux d\'activité',
    pins: 'Gestion des PINs',
  }

  return (
    <div className="min-h-screen bg-gov-900 flex">
      <SidebarNav active={tab} role={role} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="glass border-b border-white/5 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-serif text-lg font-bold text-white">{TAB_TITLES[tab] || tab}</h1>
            <p className="text-xs text-stone-600">DEE — État de San Andreas</p>
          </div>
          <Link href="/" className="text-xs text-stone-600 hover:text-stone-400 transition-colors">
            Voir le site public
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-auto">
          {tab === 'dashboard' && <DashboardHome stats={stats} />}
          {tab === 'companies' && <CompaniesList />}
          {tab === 'logs' && <LogsView />}
          {tab === 'pins' && role === 'superadmin' && <PinManager />}
        </main>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, FileText, Building2, Shield, Key,
  ScrollText, LogOut, Search, Upload, Clock, Users,
  RefreshCw, Loader2, Copy, Check, Plus, Trash2,
  Eye, EyeOff, ChevronRight, AlertCircle, UserCheck
} from 'lucide-react'
import { ActivityLog, Company } from '@/types'
import { CATEGORY_LABELS, CATEGORY_ICONS, COMPANIES } from '@/lib/companies-data'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  LOGIN_SUCCESS: { label: 'Connexion', color: 'text-green-400', icon: '🔓' },
  LOGIN_FAILED: { label: 'Échec connexion', color: 'text-red-400', icon: '🚫' },
  COMPANY_ACCESS: { label: 'Accès entreprise', color: 'text-blue-400', icon: '🏢' },
  FILE_UPLOAD: { label: 'Upload fichier', color: 'text-gold-400', icon: '📤' },
  FILE_DELETE: { label: 'Suppression', color: 'text-red-400', icon: '🗑️' },
  FILE_PIN: { label: 'Épinglage', color: 'text-amber-400', icon: '📌' },
  PIN_REGENERATED: { label: 'PIN modifié', color: 'text-purple-400', icon: '🔑' },
  ADMIN_CREATED: { label: 'Admin créé', color: 'text-emerald-400', icon: '👤' },
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function SidebarNav({ active, role, onTabChange }: { active: string; role: string; onTabChange: (t: string) => void }) {
  const isSuperAdmin = role === 'superadmin'
  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'companies', label: 'Entreprises', icon: <Building2 className="w-4 h-4" /> },
    { id: 'logs', label: 'Journaux', icon: <ScrollText className="w-4 h-4" /> },
    ...(isSuperAdmin ? [
      { id: 'pins', label: 'Gestion PINs', icon: <Key className="w-4 h-4" /> },
      { id: 'admins', label: 'Administrateurs', icon: <Users className="w-4 h-4" /> },
      { id: 'connexions', label: 'Connexions admins', icon: <UserCheck className="w-4 h-4" /> },
    ] : [
      { id: 'pins', label: 'Gestion PINs', icon: <Key className="w-4 h-4" /> },
    ]),
  ]

  return (
    <aside className="w-64 flex-shrink-0 glass border-r border-white/5 min-h-screen flex flex-col">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
            <span className="text-gold-400 text-sm font-bold font-serif">SA</span>
          </div>
          <div>
            <div className="text-white font-medium text-sm font-serif">DEE</div>
            <div className="text-stone-600 text-xs capitalize">{role}</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
              active === item.id
                ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}>
            {item.icon}{item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/5">
        <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/' }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-stone-500 hover:text-red-400 hover:bg-red-950/20 transition-all">
          <LogOut className="w-4 h-4" />Déconnexion
        </button>
      </div>
    </aside>
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
  const [customPins, setCustomPins] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/companies/list').then(r => r.json()).then(setCompanies).finally(() => setLoading(false))
  }, [])

  async function regeneratePin(companyId: string, custom?: string) {
    setRegenerating(companyId)
    const res = await fetch('/api/admin/pins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, customPin: custom }),
    })
    const data = await res.json()
    if (data.pin) setRevealedPins(prev => ({ ...prev, [companyId]: data.pin }))
    setRegenerating(null)
  }

  function copyPin(companyId: string, pin: string) {
    navigator.clipboard.writeText(pin)
    setCopied(companyId)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-400 w-6 h-6" /></div>

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-4 border border-gold-600/10 text-sm text-stone-400">
        🔑 Régénère un PIN aléatoire ou saisis un PIN personnalisé à 4 chiffres. Le PIN s'affiche une seule fois après modification.
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
          className="w-full pl-10 pr-4 py-2.5 bg-gov-800 border border-stone-700 rounded-xl text-sm text-white outline-none focus:border-stone-600" />
      </div>
      <div className="space-y-2">
        {filtered.map(company => {
          const pin = revealedPins[company.id]
          const accentColor = COMPANIES.find(c => c.slug === company.slug)?.accentColor || '#888'
          return (
            <div key={company.id} className="glass rounded-xl p-4 border border-white/5 flex items-center gap-4">
              <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{company.name}</div>
                <div className="text-xs text-stone-600 capitalize">{CATEGORY_LABELS[company.category] || company.category}</div>
              </div>
              {/* PIN perso */}
              <input
                type="text" maxLength={4} placeholder="PIN perso"
                value={customPins[company.id] || ''}
                onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setCustomPins(p => ({ ...p, [company.id]: e.target.value })) }}
                className="w-24 bg-gov-700 border border-stone-700 rounded-lg px-2 py-1.5 text-center font-mono text-gold-400 text-sm outline-none focus:border-gold-600/50"
              />
              {/* PIN affiché */}
              {pin ? (
                <div className="flex items-center gap-2 bg-gov-700 rounded-lg px-3 py-1.5">
                  <span className="font-mono text-gold-400 font-bold tracking-widest text-lg">{pin}</span>
                  <button onClick={() => copyPin(company.id, pin)}>
                    {copied === company.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                  </button>
                </div>
              ) : (
                <div className="bg-gov-700 rounded-lg px-3 py-1.5">
                  <span className="font-mono text-stone-600 tracking-widest">••••</span>
                </div>
              )}
              <button
                onClick={() => regeneratePin(company.id, customPins[company.id] || undefined)}
                disabled={regenerating === company.id}
                className="p-2 rounded-lg bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition-all disabled:opacity-40"
                title={customPins[company.id] ? `Définir PIN: ${customPins[company.id]}` : 'Générer PIN aléatoire'}>
                {regenerating === company.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Admin Manager ────────────────────────────────────────────────────────────
function AdminManager() {
  const [admins, setAdmins] = useState<{ id: string; username: string; role: string; createdAt: string; lastLogin?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'superadmin'>('admin')
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/admins').then(r => r.json()).then(setAdmins).finally(() => setLoading(false))
  }, [])

  async function createAdmin() {
    if (!username || !password) return setError('Remplis tous les champs')
    setSaving(true); setError('')
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setAdmins(prev => [...prev, data.admin])
    setUsername(''); setPassword(''); setShowForm(false); setSaving(false)
  }

  async function deleteAdmin(adminId: string, adminName: string) {
    if (!confirm(`Supprimer l'admin "${adminName}" ?`)) return
    await fetch('/api/admin/admins', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId }),
    })
    setAdmins(prev => prev.filter(a => a.id !== adminId))
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-400 w-6 h-6" /></div>

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)}
        className="flex items-center gap-2 btn-gold px-4 py-2 rounded-xl text-sm font-semibold">
        <Plus className="w-4 h-4" /> Créer un administrateur
      </button>

      {showForm && (
        <div className="glass rounded-2xl p-6 border border-gold-600/10 space-y-4">
          <h3 className="text-white font-semibold">Nouvel administrateur</h3>
          {error && <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/40 rounded-xl px-4 py-3 text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-stone-500 uppercase tracking-wider mb-1.5 block">Identifiant</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                className="w-full bg-gov-800 border border-stone-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-gold-600/50"
                placeholder="nom_admin" />
            </div>
            <div>
              <label className="text-xs text-stone-500 uppercase tracking-wider mb-1.5 block">Mot de passe</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gov-800 border border-stone-700 rounded-xl px-4 py-2.5 pr-10 text-white text-sm outline-none focus:border-gold-600/50"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-500 uppercase tracking-wider mb-1.5 block">Rôle</label>
            <select value={role} onChange={e => setRole(e.target.value as 'admin' | 'superadmin')}
              className="bg-gov-800 border border-stone-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-gold-600/50">
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={createAdmin} disabled={saving}
              className="btn-gold px-6 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Créer
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-xl text-sm text-stone-400 hover:text-white border border-stone-700 hover:border-stone-600 transition-all">
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {admins.map(admin => (
          <div key={admin.id} className="glass rounded-xl p-4 border border-white/5 flex items-center gap-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${admin.role === 'superadmin' ? 'bg-gold-500/20 text-gold-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {admin.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm">{admin.username}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${admin.role === 'superadmin' ? 'bg-gold-500/10 text-gold-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {admin.role}
                </span>
              </div>
              <div className="text-xs text-stone-600 mt-0.5">
                Créé le {new Date(admin.createdAt).toLocaleDateString('fr-FR')}
                {admin.lastLogin && ` · Dernière connexion: ${new Date(admin.lastLogin).toLocaleDateString('fr-FR')}`}
              </div>
            </div>
            <button onClick={() => deleteAdmin(admin.id, admin.username)}
              className="p-2 rounded-lg text-stone-600 hover:text-red-400 hover:bg-red-950/20 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Connexions Admins ────────────────────────────────────────────────────────
function ConnexionsAdmins() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Record<string, { count: number; lastLogin: string }>>({})

  useEffect(() => {
    fetch('/api/admin/logs?limit=500').then(r => r.json()).then((data: ActivityLog[]) => {
      setLogs(data)
      // Calcul stats par admin
      const s: Record<string, { count: number; lastLogin: string }> = {}
      for (const log of data) {
        if (log.action === 'LOGIN_SUCCESS') {
          if (!s[log.userLabel]) s[log.userLabel] = { count: 0, lastLogin: log.timestamp }
          s[log.userLabel].count++
          if (log.timestamp > s[log.userLabel].lastLogin) s[log.userLabel].lastLogin = log.timestamp
        }
      }
      setStats(s)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-400 w-6 h-6" /></div>

  const loginLogs = logs.filter(l => l.action === 'LOGIN_SUCCESS' || l.action === 'LOGIN_FAILED')

  return (
    <div className="space-y-6">
      {/* Stats par admin */}
      <div>
        <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">Résumé par administrateur</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(stats).map(([name, data]) => (
            <div key={name} className="glass rounded-xl p-4 border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-400 text-xs font-bold">
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-white font-medium text-sm">{name}</span>
              </div>
              <div className="text-2xl font-bold font-serif text-white">{data.count}</div>
              <div className="text-xs text-stone-500">connexions au total</div>
              <div className="text-xs text-stone-600 mt-1">
                Dernière: {formatDistanceToNow(new Date(data.lastLogin), { addSuffix: true, locale: fr })}
              </div>
            </div>
          ))}
          {Object.keys(stats).length === 0 && (
            <div className="text-stone-600 text-sm">Aucune connexion enregistrée</div>
          )}
        </div>
      </div>

      {/* Historique détaillé */}
      <div>
        <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-3">Historique des connexions</h3>
        <div className="space-y-2">
          {loginLogs.slice(0, 50).map(log => (
            <div key={log.id} className="flex items-center gap-4 glass rounded-xl px-4 py-3 border border-white/5">
              <span className="text-lg">{log.action === 'LOGIN_SUCCESS' ? '🔓' : '🚫'}</span>
              <div className="flex-1">
                <span className={`text-sm font-medium ${log.action === 'LOGIN_SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>
                  {log.userLabel}
                </span>
                {log.ip && <span className="text-xs text-stone-600 ml-2 font-mono">{log.ip}</span>}
              </div>
              <div className="text-xs text-stone-600">
                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: fr })}
              </div>
            </div>
          ))}
          {loginLogs.length === 0 && <div className="text-stone-600 text-sm text-center py-8">Aucune connexion enregistrée</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Logs ─────────────────────────────────────────────────────────────────────
function LogsView() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/logs?limit=200').then(r => r.json()).then(setLogs).finally(() => setLoading(false))
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
                {log.companyName && <span className="text-xs text-stone-500 bg-gov-700 px-2 py-0.5 rounded-full">{log.companyName}</span>}
                {log.fileName && <span className="text-xs text-stone-600 truncate max-w-32">{log.fileName}</span>}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-stone-600">{log.userLabel}</span>
                {log.ip && <span className="text-xs text-stone-700 font-mono">{log.ip}</span>}
              </div>
            </div>
            <div className="text-xs text-stone-600 flex-shrink-0">
              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: fr })}
            </div>
          </div>
        )
      })}
      {logs.length === 0 && <div className="text-center py-20 text-stone-600 text-sm">Aucun journal</div>}
    </div>
  )
}

// ─── Companies ────────────────────────────────────────────────────────────────
function CompaniesList() {
  const [search, setSearch] = useState('')
  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
          className="w-full pl-10 pr-4 py-2.5 bg-gov-800 border border-stone-700 rounded-xl text-sm text-white outline-none focus:border-stone-600" />
      </div>
      {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
        const companies = COMPANIES.filter(c => c.category === cat && c.name.toLowerCase().includes(search.toLowerCase()))
        if (!companies.length) return null
        return (
          <div key={cat}>
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>{CATEGORY_ICONS[cat]}</span>{label}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {companies.map(c => (
                <Link key={c.slug} href={`/company/${c.slug}`}
                  className="flex items-center gap-3 glass rounded-xl px-4 py-3 border border-white/5 hover:border-white/10 transition-all group">
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
  const recentFiles = (stats.recentFiles as Array<{ id: string; name: string; companySlug: string; uploadedAt: string }>) || []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Fichiers totaux', value: stats.totalFiles as number, icon: <FileText className="w-5 h-5" />, color: 'text-blue-400' },
          { label: 'Entreprises actives', value: stats.totalCompanies as number, icon: <Building2 className="w-5 h-5" />, color: 'text-green-400' },
          { label: 'Administrateurs', value: stats.totalAdmins as number, icon: <Shield className="w-5 h-5" />, color: 'text-gold-400' },
          { label: 'Actions récentes', value: recentLogs.length, icon: <ScrollText className="w-5 h-5" />, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-5 border border-white/5">
            <div className={`mb-3 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl font-bold font-serif text-white mb-0.5">{s.value}</div>
            <div className="text-sm text-stone-400">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Upload className="w-4 h-4 text-gold-400" />Derniers fichiers</h3>
          <div className="space-y-2">
            {recentFiles.slice(0, 6).map(f => (
              <div key={f.id} className="flex items-center gap-3 text-sm">
                <FileText className="w-4 h-4 text-stone-600 flex-shrink-0" />
                <span className="text-stone-300 truncate flex-1">{f.name}</span>
                <span className="text-xs text-stone-600">{f.companySlug}</span>
              </div>
            ))}
            {recentFiles.length === 0 && <p className="text-stone-600 text-sm text-center py-4">Aucun fichier</p>}
          </div>
        </div>
        <div className="glass rounded-2xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-gold-400" />Activité récente</h3>
          <div className="space-y-2">
            {recentLogs.slice(0, 6).map(log => {
              const meta = ACTION_LABELS[log.action] || { label: log.action, color: 'text-stone-400', icon: '📋' }
              return (
                <div key={log.id} className="flex items-center gap-3 text-sm">
                  <span className="text-base">{meta.icon}</span>
                  <span className={`flex-1 ${meta.color}`}>{meta.label}</span>
                  <span className="text-xs text-stone-600">{log.userLabel}</span>
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
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated || d.session.role === 'company') { router.push('/login'); return }
      setRole(d.session.role)
      setChecking(false)
    })
  }, [router])

  useEffect(() => {
    if (tab === 'dashboard') fetch('/api/admin/stats').then(r => r.json()).then(setStats)
  }, [tab])

  if (checking) return <div className="min-h-screen bg-gov-900 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div>

  const TAB_TITLES: Record<string, string> = {
    dashboard: 'Tableau de bord',
    companies: 'Entreprises',
    logs: "Journaux d'activité",
    pins: 'Gestion des PINs',
    admins: 'Administrateurs',
    connexions: 'Connexions admins',
  }

  return (
    <div className="min-h-screen bg-gov-900 flex">
      <SidebarNav active={tab} role={role} onTabChange={setTab} />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="glass border-b border-white/5 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-serif text-lg font-bold text-white">{TAB_TITLES[tab] || tab}</h1>
            <p className="text-xs text-stone-600">DEE — État de San Andreas</p>
          </div>
          <Link href="/" className="text-xs text-stone-600 hover:text-stone-400 transition-colors">Voir le site public</Link>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          {tab === 'dashboard' && <DashboardHome stats={stats} />}
          {tab === 'companies' && <CompaniesList />}
          {tab === 'logs' && <LogsView />}
          {tab === 'pins' && <PinManager />}
          {tab === 'admins' && role === 'superadmin' && <AdminManager />}
          {tab === 'connexions' && role === 'superadmin' && <ConnexionsAdmins />}
        </main>
      </div>
    </div>
  )
}

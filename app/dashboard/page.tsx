'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, FileText, Building2, Shield, Key,
  ScrollText, LogOut, Search, Upload, Clock, Users,
  RefreshCw, Loader2, Copy, Check, Plus, Trash2,
  Eye, EyeOff, ChevronRight, UserCheck, Settings,
  CheckSquare, Square, Lock, Home
} from 'lucide-react'
import { ActivityLog, Company, AdminUser, Permissions, DEFAULT_PERMISSIONS, UserRole } from '@/types'
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
  FILE_UNPIN: { label: 'Désépinglage', color: 'text-stone-400', icon: '📌' },
  PIN_REGENERATED: { label: 'PIN modifié', color: 'text-purple-400', icon: '🔑' },
  ADMIN_CREATED: { label: 'Admin créé', color: 'text-emerald-400', icon: '👤' },
  CONSULTANT_CREATED: { label: 'Consultant créé', color: 'text-cyan-400', icon: '👤' },
  PERMISSIONS_UPDATED: { label: 'Permissions modifiées', color: 'text-orange-400', icon: '🔧' },
  USER_DELETED: { label: 'Utilisateur supprimé', color: 'text-red-400', icon: '🗑️' },
  COMPANY_CREATED: { label: 'Entreprise créée', color: 'text-cyan-400', icon: '🏗️' },
}

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-gold-500/20 text-gold-400 border border-gold-500/30',
  admin: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  consultant: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
}

const PERM_LABELS: { key: keyof Omit<Permissions, 'visibleTabs'>; label: string; group: string }[] = [
  { key: 'canUploadFiles', label: 'Uploader des fichiers', group: 'Fichiers' },
  { key: 'canDownloadFiles', label: 'Télécharger des fichiers', group: 'Fichiers' },
  { key: 'canDeleteFiles', label: 'Supprimer des fichiers', group: 'Fichiers' },
  { key: 'canPinFiles', label: 'Épingler des fichiers', group: 'Fichiers' },
  { key: 'canViewAllCompanies', label: 'Voir toutes les entreprises', group: 'Entreprises' },
  { key: 'canManageCompanies', label: 'Gérer les entreprises', group: 'Entreprises' },
  { key: 'canManageConsultants', label: 'Gérer les consultants', group: 'Gestion' },
  { key: 'canManageAdmins', label: 'Gérer les admins', group: 'Gestion' },
  { key: 'canManagePins', label: 'Gérer les PINs entreprise', group: 'Gestion' },
  { key: 'canViewLogs', label: 'Voir les journaux', group: 'Gestion' },
  { key: 'canViewConnexions', label: 'Voir les connexions', group: 'Gestion' },
]

const ALL_TABS = ['dashboard', 'companies', 'logs', 'pins', 'admins', 'connexions'] as const
const TAB_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord', companies: 'Entreprises', logs: 'Journaux',
  pins: 'Gestion PINs', admins: 'Utilisateurs', connexions: 'Connexions',
}

// ─── Permissions Editor ────────────────────────────────────────────────────────
function PermissionsEditor({ user, myRole, onSaved, onCancel }: {
  user: AdminUser & { permissions: Permissions }
  myRole: string
  onSaved: (p: Permissions) => void
  onCancel: () => void
}) {
  const [perms, setPerms] = useState<Permissions>({ ...user.permissions })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const canEdit = myRole === 'superadmin' || (myRole === 'admin' && user.role === 'consultant')
  const groups = [...new Set(PERM_LABELS.map(p => p.group))]

  function toggle(key: keyof Omit<Permissions, 'visibleTabs'>) {
    if (!canEdit) return
    setPerms(p => ({ ...p, [key]: !p[key] }))
  }

  function toggleTab(tab: string) {
    if (!canEdit) return
    setPerms(p => ({
      ...p,
      visibleTabs: p.visibleTabs.includes(tab as typeof ALL_TABS[number])
        ? p.visibleTabs.filter(t => t !== tab)
        : [...p.visibleTabs, tab as typeof ALL_TABS[number]],
    }))
  }

  async function save() {
    setSaving(true); setError('')
    const res = await fetch('/api/admin/admins', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, permissions: perms }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    onSaved(perms); setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="glass rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold">Permissions — {user.username}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${ROLE_COLORS[user.role] || ''}`}>{user.role}</span>
          </div>
          {!canEdit && <div className="flex items-center gap-1 text-xs text-stone-500"><Lock className="w-3 h-3" />Lecture seule</div>}
        </div>
        <div className="p-5 space-y-5">
          {/* Accès fonctionnels */}
          {groups.map(group => (
            <div key={group}>
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">{group}</h3>
              <div className="space-y-1.5">
                {PERM_LABELS.filter(p => p.group === group).map(({ key, label }) => {
                  const val = perms[key] as boolean
                  return (
                    <button key={key} onClick={() => toggle(key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all border ${
                        val ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                           : 'border-stone-700 bg-gov-800 text-stone-500'
                      } ${canEdit ? 'hover:opacity-80 cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                      {val ? <CheckSquare className="w-4 h-4 flex-shrink-0" /> : <Square className="w-4 h-4 flex-shrink-0" />}
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Onglets visibles */}
          <div>
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Onglets visibles dans le dashboard</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_TABS.map(tab => {
                const active = perms.visibleTabs.includes(tab)
                return (
                  <button key={tab} onClick={() => toggleTab(tab)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                      active ? 'border-gold-500/30 bg-gold-500/10 text-gold-400'
                            : 'border-stone-700 bg-gov-800 text-stone-500'
                    } ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                    {active ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    {TAB_LABELS[tab]}
                  </button>
                )
              })}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            {canEdit && (
              <button onClick={save} disabled={saving}
                className="flex-1 btn-gold py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sauvegarder'}
              </button>
            )}
            <button onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-stone-400 border border-stone-700 hover:border-stone-600 transition-all">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function SidebarNav({ active, role, permissions, onTabChange }: {
  active: string; role: string; permissions: Permissions; onTabChange: (t: string) => void
}) {
  const tabs = permissions.visibleTabs ?? DEFAULT_PERMISSIONS[role as UserRole]?.visibleTabs ?? []
  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="w-4 h-4" /> },
    ...ALL_TABS.filter(t => t !== 'dashboard' && tabs.includes(t)).map(t => ({
      id: t,
      label: TAB_LABELS[t],
      icon: t === 'companies' ? <Building2 className="w-4 h-4" />
           : t === 'logs' ? <ScrollText className="w-4 h-4" />
           : t === 'pins' ? <Key className="w-4 h-4" />
           : t === 'admins' ? <Users className="w-4 h-4" />
           : <UserCheck className="w-4 h-4" />,
    })),
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
            <div className={`text-xs px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${ROLE_COLORS[role] || 'text-stone-500'}`}>{role}</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <button key={item.id} onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
              active === item.id ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                                 : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}>
            {item.icon}{item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-white/5 space-y-1">
        {/* Bouton retour accueil — navigate direct sans trigger loading screen */}
        <button onClick={() => { window.location.href = '/?from=admin' }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-stone-400 hover:text-white hover:bg-white/5 transition-all">
          <Home className="w-4 h-4" />Retour à l'accueil
        </button>
        <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/?from=admin' }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-stone-500 hover:text-red-400 hover:bg-red-950/20 transition-all">
          <LogOut className="w-4 h-4" />Déconnexion
        </button>
      </div>
    </aside>
  )
}

// ─── User Manager ──────────────────────────────────────────────────────────────
function UserManager({ myRole }: { myRole: string }) {
  const [users, setUsers] = useState<(AdminUser & { permissions: Permissions })[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'consultant'>('consultant')
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState<(AdminUser & { permissions: Permissions }) | null>(null)

  useEffect(() => {
    fetch('/api/admin/admins').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setUsers(data)
    }).finally(() => setLoading(false))
  }, [])

  async function createUser() {
    if (!username || !password) return setError('Remplis tous les champs')
    setSaving(true); setError('')
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role: newRole }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setUsers(prev => [...prev, { ...data.user, permissions: DEFAULT_PERMISSIONS[newRole as UserRole], createdAt: new Date().toISOString() }])
    setUsername(''); setPassword(''); setShowForm(false); setSaving(false)
  }

  async function deleteUser(userId: string, uname: string) {
    if (!confirm(`Supprimer "${uname}" ?`)) return
    const res = await fetch('/api/admin/admins', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== userId))
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-400 w-6 h-6" /></div>

  const byRole = (r: string) => users.filter(u => u.role === r)

  return (
    <div className="space-y-6">
      {editingUser && (
        <PermissionsEditor
          user={editingUser}
          myRole={myRole}
          onSaved={p => {
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, permissions: p } : u))
            setEditingUser(null)
          }}
          onCancel={() => setEditingUser(null)}
        />
      )}

      <div className="glass rounded-xl p-4 border border-gold-600/10 text-sm text-stone-400">
        🏛️ <strong className="text-white">Hiérarchie :</strong> Superadmin → Admin → Consultant. Clique sur <Settings className="w-3 h-3 inline" /> pour gérer les permissions de chaque utilisateur.
      </div>

      {(myRole === 'superadmin' || myRole === 'admin') && (
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/20 text-sm hover:bg-gold-500/20 transition-all">
          <Plus className="w-4 h-4" />Créer un utilisateur
        </button>
      )}

      {showForm && (
        <div className="glass rounded-xl p-5 border border-gold-600/20 space-y-4">
          <h3 className="text-white font-semibold text-sm">Nouvel utilisateur</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Nom d'utilisateur"
              className="bg-gov-800 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-stone-500" />
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe"
                className="w-full bg-gov-800 border border-stone-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-white outline-none focus:border-stone-500" />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setNewRole('consultant')}
              className={`px-4 py-2 rounded-lg text-sm border transition-all ${newRole === 'consultant' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-stone-700 text-stone-400'}`}>
              Consultant
            </button>
            {myRole === 'superadmin' && (
              <button onClick={() => setNewRole('admin')}
                className={`px-4 py-2 rounded-lg text-sm border transition-all ${newRole === 'admin' ? 'border-blue-500/40 bg-blue-500/10 text-blue-400' : 'border-stone-700 text-stone-400'}`}>
                Admin
              </button>
            )}
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button onClick={createUser} disabled={saving}
              className="btn-gold px-6 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
            </button>
            <button onClick={() => { setShowForm(false); setError('') }}
              className="px-6 py-2 rounded-xl text-sm text-stone-400 border border-stone-700 hover:border-stone-600 transition-all">Annuler</button>
          </div>
        </div>
      )}

      {[{ label: 'Superadmin', key: 'superadmin' }, { label: 'Admins', key: 'admin' }, { label: 'Consultants', key: 'consultant' }].map(({ label, key }) => {
        const items = byRole(key)
        if (!items.length) return null
        return (
          <div key={key}>
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">{label}</h3>
            <div className="space-y-2">
              {items.map(user => (
                <div key={user.id} className="glass rounded-xl p-4 border border-white/5 flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${ROLE_COLORS[user.role] || ''}`}>
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium text-sm">{user.username}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role] || ''}`}>{user.role}</span>
                    </div>
                    <div className="text-xs text-stone-600 mt-0.5">
                      Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      {user.lastLogin && ` · Dernière connexion: ${new Date(user.lastLogin).toLocaleDateString('fr-FR')}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.role !== 'superadmin' && (myRole === 'superadmin' || (myRole === 'admin' && user.role === 'consultant')) && (
                      <button onClick={() => setEditingUser(user)}
                        className="p-2 rounded-lg text-stone-500 hover:text-gold-400 hover:bg-gold-500/10 transition-all" title="Permissions">
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                    {user.role !== 'superadmin' && (myRole === 'superadmin' || (myRole === 'admin' && user.role === 'consultant')) && (
                      <button onClick={() => deleteUser(user.id, user.username)}
                        className="p-2 rounded-lg text-stone-600 hover:text-red-400 hover:bg-red-950/20 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
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

  const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-400 w-6 h-6" /></div>

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-4 border border-gold-600/10 text-sm text-stone-400">
        🔑 Régénère ou définis un PIN personnalisé (4 chiffres) pour chaque entreprise.
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
          className="w-full pl-10 pr-4 py-2.5 bg-gov-800 border border-stone-700 rounded-xl text-sm text-white outline-none focus:border-stone-600" />
      </div>
      <div className="space-y-2">
        {filtered.map(company => {
          const pin = revealedPins[company.id]
          const accent = COMPANIES.find(c => c.slug === company.slug)?.accentColor || '#888'
          return (
            <div key={company.id} className="glass rounded-xl p-4 border border-white/5 flex items-center gap-4">
              <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{company.name}</div>
                <div className="text-xs text-stone-600 capitalize">{CATEGORY_LABELS[company.category]}</div>
              </div>
              <input type="text" maxLength={4} placeholder="PIN perso"
                value={customPins[company.id] || ''}
                onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setCustomPins(p => ({ ...p, [company.id]: e.target.value })) }}
                className="w-24 bg-gov-700 border border-stone-700 rounded-lg px-2 py-1.5 text-center font-mono text-gold-400 text-sm outline-none focus:border-gold-600/50" />
              {pin ? (
                <div className="flex items-center gap-2 bg-gov-700 rounded-lg px-3 py-1.5">
                  <span className="font-mono text-gold-400 font-bold tracking-widest text-lg">{pin}</span>
                  <button onClick={() => { navigator.clipboard.writeText(pin); setCopied(company.id); setTimeout(() => setCopied(null), 2000) }}>
                    {copied === company.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                  </button>
                </div>
              ) : (
                <div className="bg-gov-700 rounded-lg px-3 py-1.5">
                  <span className="font-mono text-stone-600 tracking-widest">••••</span>
                </div>
              )}
              <button onClick={() => regeneratePin(company.id, customPins[company.id] || undefined)}
                disabled={regenerating === company.id}
                className="p-2 rounded-lg bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition-all disabled:opacity-40">
                {regenerating === company.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
            </div>
          )
        })}
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
                {log.fileName && <span className="text-xs text-stone-600 truncate max-w-xs">{log.fileName}</span>}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-stone-600">{log.userLabel}</span>
                {log.details && <span className="text-xs text-stone-700">{log.details}</span>}
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

// ─── Connexions ───────────────────────────────────────────────────────────────
function ConnexionsAdmins() {
  const [stats, setStats] = useState<Record<string, { count: number; lastLogin: string }>>({})
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/admin/logs?limit=500').then(r => r.json()).then((data: ActivityLog[]) => {
      setLogs(data)
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(stats).map(([name, data]) => (
          <div key={name} className="glass rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-400 text-xs font-bold">{name.slice(0, 2).toUpperCase()}</div>
              <span className="text-white font-medium text-sm">{name}</span>
            </div>
            <div className="text-2xl font-bold font-serif text-white">{data.count}</div>
            <div className="text-xs text-stone-500">connexions</div>
            <div className="text-xs text-stone-600 mt-1">{formatDistanceToNow(new Date(data.lastLogin), { addSuffix: true, locale: fr })}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {loginLogs.slice(0, 50).map(log => (
          <div key={log.id} className="flex items-center gap-4 glass rounded-xl px-4 py-3 border border-white/5">
            <span className="text-lg">{log.action === 'LOGIN_SUCCESS' ? '🔓' : '🚫'}</span>
            <div className="flex-1">
              <span className={`text-sm font-medium ${log.action === 'LOGIN_SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>{log.userLabel}</span>
              {log.ip && <span className="text-xs text-stone-600 ml-2 font-mono">{log.ip}</span>}
            </div>
            <div className="text-xs text-stone-600">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: fr })}</div>
          </div>
        ))}
      </div>
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
                <a key={c.slug} href={`/company/${c.slug}`}
                  className="flex items-center gap-3 glass rounded-xl px-4 py-3 border border-white/5 hover:border-white/10 transition-all group">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.accentColor }} />
                  <span className="text-sm text-stone-300 group-hover:text-white transition-colors">{c.name}</span>
                  <ChevronRight className="w-4 h-4 text-stone-700 ml-auto group-hover:text-stone-400 transition-colors" />
                </a>
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
  const recentFiles = (stats.recentFiles as Array<{ id: string; name: string; companySlug: string }>) || []
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Fichiers totaux', value: stats.totalFiles as number, icon: <FileText className="w-5 h-5" />, color: 'text-blue-400' },
          { label: 'Entreprises', value: stats.totalCompanies as number, icon: <Building2 className="w-5 h-5" />, color: 'text-green-400' },
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

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState('dashboard')
  const [role, setRole] = useState('')
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS.admin)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated || d.session?.role === 'company') { router.push('/login'); return }
      setRole(d.session.role)
      setPermissions(d.permissions ?? DEFAULT_PERMISSIONS[d.session.role as UserRole])
      setChecking(false)
    })
  }, [router])

  useEffect(() => {
    if (tab === 'dashboard') fetch('/api/admin/stats').then(r => r.json()).then(setStats)
  }, [tab])

  if (checking) return <div className="min-h-screen bg-gov-900 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div>

  return (
    <div className="min-h-screen bg-gov-900 flex">
      <SidebarNav active={tab} role={role} permissions={permissions} onTabChange={setTab} />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="glass border-b border-white/5 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-serif text-lg font-bold text-white">{TAB_LABELS[tab] || tab}</h1>
            <p className="text-xs text-stone-600">DEE — État de San Andreas</p>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          {tab === 'dashboard' && <DashboardHome stats={stats} />}
          {tab === 'companies' && <CompaniesList />}
          {tab === 'logs' && <LogsView />}
          {tab === 'pins' && <PinManager />}
          {tab === 'admins' && <UserManager myRole={role} />}
          {tab === 'connexions' && <ConnexionsAdmins />}
        </main>
      </div>
    </div>
  )
}

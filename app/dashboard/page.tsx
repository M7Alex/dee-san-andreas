'use client'

import { useState, useEffect, useRef } from 'react'
import { EagleLogo } from '@/components/EagleLogo'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, FileText, Building2, Shield, Key,
  ScrollText, LogOut, Search, Upload, Clock, Users,
  RefreshCw, Loader2, Copy, Check, Plus, Trash2,
  Eye, EyeOff, ChevronRight, UserCheck, Settings,
  CheckSquare, Square, Lock, Unlock, Folder, FolderLock, X, Filter,
  Activity, BarChart3, Globe, AlertTriangle, TrendingUp,
  ChevronLeft, Menu, Bell
} from 'lucide-react'
import { ActivityLog, Company, AdminUser, Permissions, DEFAULT_PERMISSIONS, UserRole, CustomFolder } from '@/types'
import { BAGManager } from '@/components/BAGManager'
import { CATEGORY_LABELS, CATEGORY_ICONS, COMPANIES } from '@/lib/companies-data'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

// ─── Constants ────────────────────────────────────────────────────────────────
const ACTION_LABELS: Record<string, { label: string; color: string; icon: string; category: string }> = {
  LOGIN_SUCCESS: { label: 'Connexion', color: 'text-emerald-400', icon: '🔓', category: 'connexion' },
  LOGIN_FAILED: { label: 'Échec connexion', color: 'text-red-400', icon: '🚫', category: 'connexion' },
  COMPANY_ACCESS: { label: 'Accès entreprise', color: 'text-blue-400', icon: '🏢', category: 'connexion' },
  FILE_UPLOAD: { label: 'Upload fichier', color: 'text-amber-400', icon: '📤', category: 'fichier' },
  FILE_DELETE: { label: 'Suppression fichier', color: 'text-red-400', icon: '🗑️', category: 'fichier' },
  FILE_PIN: { label: 'Épinglage', color: 'text-amber-400', icon: '📌', category: 'fichier' },
  FILE_UNPIN: { label: 'Désépinglage', color: 'text-stone-400', icon: '📌', category: 'fichier' },
  PIN_REGENERATED: { label: 'PIN modifié', color: 'text-purple-400', icon: '🔑', category: 'admin' },
  ADMIN_CREATED: { label: 'Admin créé', color: 'text-emerald-400', icon: '👤', category: 'admin' },
  CONSULTANT_CREATED: { label: 'Consultant créé', color: 'text-cyan-400', icon: '👤', category: 'admin' },
  PERMISSIONS_UPDATED: { label: 'Permissions modifiées', color: 'text-orange-400', icon: '🔧', category: 'admin' },
  USER_DELETED: { label: 'Utilisateur supprimé', color: 'text-red-400', icon: '🗑️', category: 'admin' },
  COMPANY_CREATED: { label: 'Entreprise créée', color: 'text-cyan-400', icon: '🏗️', category: 'admin' },
  FOLDER_CREATED: { label: 'Dossier créé', color: 'text-blue-300', icon: '📁', category: 'dossier' },
  FOLDER_RENAMED: { label: 'Dossier renommé', color: 'text-blue-300', icon: '✏️', category: 'dossier' },
  FOLDER_DELETED: { label: 'Dossier supprimé', color: 'text-red-300', icon: '🗂️', category: 'dossier' },
  FOLDER_LOCKED: { label: 'Dossier verrouillé', color: 'text-amber-400', icon: '🔒', category: 'dossier' },
  FOLDER_UNLOCKED: { label: 'Dossier déverrouillé', color: 'text-emerald-300', icon: '🔓', category: 'dossier' },
  FILE_VIEW: { label: 'Fichier consulté', color: 'text-sky-400', icon: '👁️', category: 'consultation' },
  BAG_CREATED: { label: 'BAG créé', color: 'text-gold-400', icon: '📋', category: 'admin' },
  BAG_UPDATED: { label: 'BAG modifié', color: 'text-gold-400', icon: '📋', category: 'admin' },
  BAG_DELETED: { label: 'BAG supprimé', color: 'text-red-400', icon: '📋', category: 'admin' },
  FILE_DOWNLOAD: { label: 'Fichier téléchargé', color: 'text-sky-300', icon: '⬇️', category: 'consultation' },
}

const ROLE_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  superadmin: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/25', label: 'Superadmin' },
  admin: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/25', label: 'Admin' },
  consultant: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/25', label: 'Consultant' },
}

const PERM_LABELS: { key: keyof Permissions; label: string; group: string; desc: string }[] = [
  { key: 'canUploadFiles', label: 'Upload de fichiers', group: 'Fichiers', desc: 'Peut déposer des fichiers dans les dossiers entreprise' },
  { key: 'canDownloadFiles', label: 'Téléchargement', group: 'Fichiers', desc: 'Peut télécharger les fichiers existants' },
  { key: 'canDeleteFiles', label: 'Suppression', group: 'Fichiers', desc: 'Peut supprimer des fichiers définitivement' },
  { key: 'canPinFiles', label: 'Épinglage', group: 'Fichiers', desc: 'Peut marquer un fichier comme épinglé' },
  { key: 'canViewAllCompanies', label: 'Voir toutes les entreprises', group: 'Entreprises', desc: 'Accès à la liste complète' },
  { key: 'canManageCompanies', label: 'Gérer les entreprises', group: 'Entreprises', desc: 'Créer, modifier, désactiver' },
  { key: 'canManageConsultants', label: 'Créer des consultants', group: 'Utilisateurs', desc: 'Gérer les comptes consultant' },
  { key: 'canManageAdmins', label: 'Créer des admins', group: 'Utilisateurs', desc: 'Superadmin uniquement' },
  { key: 'canManagePins', label: 'Gérer les PINs', group: 'Accès', desc: 'Régénérer les PINs d\'accès' },
  { key: 'canViewLogs', label: 'Journaux d\'activité', group: 'Accès', desc: 'Voir l\'historique des actions' },
  { key: 'canManageFolders', label: 'Gestion dossiers', group: 'Accès', desc: 'Verrouiller/déverrouiller des dossiers' },
  { key: 'canViewFolderPins', label: 'Voir les PINs dossiers', group: 'Accès', desc: 'Consulter les codes PIN en clair' },
]

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(ease * value))
      if (p < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, duration])
  return <>{display}</>
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function SidebarNav({ active, role, permissions, onTabChange, collapsed, onToggle }: {
  active: string; role: string; permissions: Permissions | null
  onTabChange: (t: string) => void; collapsed: boolean; onToggle: () => void
}) {
  const isSuperAdmin = role === 'superadmin'
  const isAdmin = role === 'admin' || isSuperAdmin
  const tabs = permissions?.visibleTabs ?? DEFAULT_PERMISSIONS[role as UserRole]?.visibleTabs ?? []
  const rs = ROLE_STYLES[role] || ROLE_STYLES.consultant

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, always: true, section: 'main' },
    { id: 'companies', label: 'Entreprises', icon: Building2, show: tabs.includes('companies'), section: 'main' },
    { id: 'companies-new', label: 'Créer entreprise', icon: Plus, show: isSuperAdmin || (isAdmin && (permissions?.canManageCompanies ?? false)), section: 'main' },
    { id: 'admins', label: 'Utilisateurs', icon: Users, show: tabs.includes('admins') || isAdmin, section: 'admin' },
    { id: 'pins', label: 'Gestion PINs', icon: Key, show: tabs.includes('pins'), section: 'admin' },
    { id: 'folders', label: 'Dossiers', icon: FolderLock, show: tabs.includes('folders') || isSuperAdmin || (isAdmin && (permissions?.canManageFolders ?? false)), section: 'admin' },
    { id: 'logs', label: 'Journaux', icon: ScrollText, show: tabs.includes('logs'), section: 'system' },
    { id: 'connexions', label: 'Connexions', icon: UserCheck, show: isSuperAdmin, section: 'system' },
<<<<<<< Updated upstream
=======
    { id: 'bag', label: 'B.A.G.', icon: FileText, show: permissions?.canManageBAG ?? false, section: 'main' },
>>>>>>> Stashed changes
  ].filter(i => i.always || i.show)

  const sections = [
    { id: 'main', label: 'Navigation' },
    { id: 'admin', label: 'Administration' },
    { id: 'system', label: 'Système' },
  ]

  return (
    <aside className={`sidebar-container ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="flex items-center gap-3 min-w-0">
          <div className="sidebar-logo">
            <EagleLogo size={18} className="text-amber-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0 fade-in">
              <div className="text-white font-bold text-sm tracking-wide font-serif">DEE</div>
              <div className="text-stone-500 text-xs">État de San Andreas</div>
            </div>
          )}
        </div>
        <button onClick={onToggle} className="sidebar-toggle-btn">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 pb-3 fade-in">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${rs.bg} ${rs.text} ${rs.border}`}>
            <Shield className="w-3 h-3" />
            {rs.label}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 pb-4 space-y-5 overflow-y-auto">
        {sections.map(section => {
          const items = navItems.filter(i => i.section === section.id)
          if (!items.length) return null
          return (
            <div key={section.id}>
              {!collapsed && (
                <div className="text-xs font-semibold text-stone-600 uppercase tracking-widest px-2 mb-2 fade-in">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {items.map(item => {
                  const Icon = item.icon
                  const isActive = active === item.id
                  return (
                    <button key={item.id} onClick={() => onTabChange(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'} ${collapsed ? 'nav-item-collapsed' : ''}`}>
                      <div className={`nav-item-indicator ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-amber-400' : 'text-stone-500 group-hover:text-stone-300'}`} />
                      {!collapsed && (
                        <span className="text-sm font-medium fade-in">{item.label}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={`border-t border-white/5 p-3 space-y-0.5 ${collapsed ? '' : ''}`}>
        <a href="/" target="_blank" rel="noopener noreferrer"
          title={collapsed ? 'Site public' : undefined}
          className={`nav-item nav-item-inactive ${collapsed ? 'nav-item-collapsed' : ''}`}>
          <Globe className="w-4 h-4 flex-shrink-0 text-stone-600 group-hover:text-stone-400" />
          {!collapsed && <span className="text-sm fade-in">Site public ↗</span>}
        </a>
        <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/' }}
          title={collapsed ? 'Déconnexion' : undefined}
          className={`nav-item group w-full text-left ${collapsed ? 'nav-item-collapsed' : ''}`}
          style={{ color: '#78716c' }}>
          <LogOut className="w-4 h-4 flex-shrink-0 group-hover:text-red-400 transition-colors" />
          {!collapsed && <span className="text-sm group-hover:text-red-400 transition-colors fade-in">Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)

  async function save() {
    if (!current || !next || !confirm) return setError('Tous les champs sont requis')
    if (next !== confirm) return setError('Les mots de passe ne correspondent pas')
    if (next.length < 8) return setError('Minimum 8 caractères')
    setSaving(true); setError('')
    const res = await fetch('/api/admin/change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setSuccess(true); setSaving(false)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card animate-modal">
        <div className="modal-header">
          <h2 className="modal-title"><Lock className="w-4 h-4 text-amber-400" />Changer mon mot de passe</h2>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {success ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-emerald-400 font-medium">Mot de passe mis à jour !</p>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Mot de passe actuel</label>
                <div className="input-wrapper">
                  <input type={showCurrent ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)} className="form-input pr-10" />
                  <button onClick={() => setShowCurrent(!showCurrent)} className="input-eye">{showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Nouveau mot de passe</label>
                <div className="input-wrapper">
                  <input type={showNext ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)} className="form-input pr-10" />
                  <button onClick={() => setShowNext(!showNext)} className="input-eye">{showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirmer</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="form-input" />
              </div>
              {error && <p className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" />{error}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Mettre à jour'}
                </button>
                <button onClick={onClose} className="btn-ghost flex-1">Annuler</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Permissions Editor ───────────────────────────────────────────────────────
function PermissionsEditor({ userId, username, role, current, myRole, onSaved, onCancel }: {
  userId: string; username: string; role: string; current: Permissions
  myRole: string; onSaved: (p: Permissions) => void; onCancel: () => void
}) {
  const [perms, setPerms] = useState<Permissions>({ ...current })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const groups = [...new Set(PERM_LABELS.map(p => p.group))]
  const canEdit = myRole === 'superadmin' || (myRole === 'admin' && role === 'consultant')
  const rs = ROLE_STYLES[role] || ROLE_STYLES.consultant

  async function save() {
    setSaving(true); setError('')
    const res = await fetch('/api/admin/admins', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, permissions: perms }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    onSaved(perms); setSaving(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card animate-modal max-h-[90vh] overflow-y-auto" style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title"><Settings className="w-4 h-4 text-amber-400" />Permissions — {username}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block border ${rs.bg} ${rs.text} ${rs.border}`}>{role}</span>
          </div>
          {!canEdit && <span className="text-xs text-stone-500 flex items-center gap-1"><Lock className="w-3 h-3" />Lecture seule</span>}
        </div>
        <div className="p-6 space-y-6">
          {groups.map(group => (
            <div key={group}>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-1 h-3 rounded-full bg-amber-500/60" />
                {group}
              </h3>
              <div className="space-y-2">
                {PERM_LABELS.filter(p => p.group === group).map(p => {
                  const val = perms[p.key] as boolean
                  return (
                    <button key={p.key}
                      onClick={() => canEdit && setPerms(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                      disabled={!canEdit}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${val ? 'border-emerald-500/20 bg-emerald-950/20' : 'border-stone-800 hover:border-stone-700'} disabled:cursor-default`}>
                      <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all ${val ? 'bg-emerald-500 border-emerald-500' : 'border-stone-600'}`}>
                        {val && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${val ? 'text-white' : 'text-stone-400'}`}>{p.label}</div>
                        <div className="text-xs text-stone-600 mt-0.5">{p.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {canEdit && (
            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving} className="btn-primary flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sauvegarder'}
              </button>
              <button onClick={onCancel} className="btn-ghost flex-1">Annuler</button>
            </div>
          )}
          {!canEdit && <button onClick={onCancel} className="btn-ghost w-full">Fermer</button>}
        </div>
      </div>
    </div>
  )
}

// ─── User Manager ─────────────────────────────────────────────────────────────
function UserManager({ myRole, myUserId }: { myRole: string; myUserId: string }) {
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
  const [showChangePassword, setShowChangePassword] = useState(false)
  const isSuperAdmin = myRole === 'superadmin'
  const canCreateAdmin = isSuperAdmin
  const canCreateConsultant = isSuperAdmin || myRole === 'admin'

  useEffect(() => {
    fetch('/api/admin/admins').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setUsers(data)
    }).finally(() => setLoading(false))
  }, [])

  async function createUser() {
    if (!username || !password) return setError('Remplis tous les champs')
    setSaving(true); setError('')
    const res = await fetch('/api/admin/admins', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role: newRole }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setUsers(prev => [...prev, { ...data.user, permissions: DEFAULT_PERMISSIONS[newRole] }])
    setUsername(''); setPassword(''); setShowForm(false); setSaving(false)
  }

  async function deleteUser(userId: string, uname: string) {
    if (!confirm(`Supprimer "${uname}" ?`)) return
    const res = await fetch('/api/admin/admins', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== userId))
  }

  if (loading) return <PageLoader />

  const groups = {
    superadmin: users.filter(u => u.role === 'superadmin'),
    admin: users.filter(u => u.role === 'admin'),
    consultant: users.filter(u => u.role === 'consultant')
  }

  const visibleGroups = [
    ...(isSuperAdmin ? [{ label: 'Superadmin', key: 'superadmin', items: groups.superadmin }] : []),
    { label: 'Admins', key: 'admin', items: groups.admin },
    { label: 'Consultants', key: 'consultant', items: groups.consultant },
  ]

  return (
    <div className="space-y-6">
      {editingUser && (
        <PermissionsEditor userId={editingUser.id} username={editingUser.username} role={editingUser.role}
          current={editingUser.permissions ?? DEFAULT_PERMISSIONS[editingUser.role as UserRole]}
          myRole={myRole} onSaved={(p) => { setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, permissions: p } : u)); setEditingUser(null) }}
          onCancel={() => setEditingUser(null)} />
      )}
      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}

      {isSuperAdmin && (
        <div className="info-card border-amber-500/20 bg-amber-950/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Mon compte Superadmin</div>
                <div className="text-xs text-stone-500">Zone privée — visible uniquement par vous</div>
              </div>
            </div>
            <button onClick={() => setShowChangePassword(true)} className="btn-secondary text-xs">
              <Lock className="w-3.5 h-3.5" />Changer mot de passe
            </button>
          </div>
        </div>
      )}

      <div className="info-card">
        <p className="text-xs text-stone-400">🏛️ <strong className="text-white">Hiérarchie :</strong> Superadmin → Admin → Consultant. Chaque niveau ne peut gérer que les niveaux inférieurs.</p>
      </div>

      {(canCreateAdmin || canCreateConsultant) && (
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="w-4 h-4" />Créer un utilisateur
        </button>
      )}

      {showForm && (
        <div className="panel animate-slide-down">
          <h3 className="text-white font-semibold text-sm mb-4">Nouvel utilisateur</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="form-group">
              <label className="form-label">Identifiant</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="nom.prenom" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div className="input-wrapper">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="form-input pr-10" />
                <button onClick={() => setShowPw(!showPw)} className="input-eye">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            {canCreateConsultant && (
              <button onClick={() => setNewRole('consultant')} className={`role-pill ${newRole === 'consultant' ? 'role-pill-active-emerald' : 'role-pill-inactive'}`}>Consultant</button>
            )}
            {canCreateAdmin && (
              <button onClick={() => setNewRole('admin')} className={`role-pill ${newRole === 'admin' ? 'role-pill-active-blue' : 'role-pill-inactive'}`}>Admin</button>
            )}
          </div>
          {error && <p className="text-red-400 text-sm mb-3 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" />{error}</p>}
          <div className="flex gap-3">
            <button onClick={createUser} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer'}
            </button>
            <button onClick={() => { setShowForm(false); setError('') }} className="btn-ghost">Annuler</button>
          </div>
        </div>
      )}

      {visibleGroups.map(({ label, key, items }) => items.length > 0 && (
        <div key={key}>
          <div className="section-title">{label} <span className="section-count">{items.length}</span></div>
          <div className="space-y-2">
            {items.map(user => {
              const isMe = user.id === myUserId
              const canEditUser = !isMe && (isSuperAdmin ? user.role !== 'superadmin' : myRole === 'admin' && user.role === 'consultant')
              const rs = ROLE_STYLES[user.role] || ROLE_STYLES.consultant
              return (
                <div key={user.id} className={`user-card ${isMe && isSuperAdmin ? 'border-amber-500/20' : ''}`}>
                  <div className={`user-avatar ${rs.bg} ${rs.text} ${rs.border}`}>
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">{user.username}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${rs.bg} ${rs.text} ${rs.border}`}>{user.role}</span>
                      {isMe && <span className="text-xs text-stone-600 italic">— vous</span>}
                    </div>
                    <div className="text-xs text-stone-600 mt-0.5">
                      Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      {user.lastLogin && ` · Dernière connexion : ${new Date(user.lastLogin).toLocaleDateString('fr-FR')}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {canEditUser && (
                      <button onClick={() => setEditingUser(user)} className="icon-btn" title="Gérer les permissions">
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                    {canEditUser && (
                      <button onClick={() => deleteUser(user.id, user.username)} className="icon-btn icon-btn-danger">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, customPin: custom }),
    })
    const data = await res.json()
    if (data.pin) setRevealedPins(prev => ({ ...prev, [companyId]: data.pin }))
    setRegenerating(null)
  }

  const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  if (loading) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="info-card">
        <p className="text-xs text-stone-400">🔑 Régénère un PIN aléatoire ou saisis un PIN personnalisé à 4 chiffres.</p>
      </div>
      <div className="search-bar">
        <Search className="search-icon" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une entreprise..." className="search-input" />
      </div>
      <div className="space-y-2">
        {filtered.map(company => {
          const pin = revealedPins[company.id]
          const accent = (company as any).accentColor || COMPANIES.find(c => c.slug === company.slug)?.accentColor || '#888'
          return (
            <div key={company.id} className="panel flex items-center gap-4">
              <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{company.name}</div>
                <div className="text-xs text-stone-600 capitalize">{CATEGORY_LABELS[company.category] || company.category}</div>
              </div>
              <input type="text" maxLength={4} placeholder="PIN perso"
                value={customPins[company.id] || ''}
                onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setCustomPins(p => ({ ...p, [company.id]: e.target.value })) }}
                className="w-24 bg-gov-700 border border-stone-700 rounded-lg px-3 py-1.5 text-center font-mono text-amber-400 text-sm outline-none focus:border-amber-600/50 transition-colors" />
              {pin ? (
                <div className="flex items-center gap-2 bg-gov-700 border border-stone-700 rounded-lg px-3 py-1.5">
                  <span className="font-mono text-amber-400 font-bold tracking-[0.3em] text-base">{pin}</span>
                  <button onClick={() => { navigator.clipboard.writeText(pin); setCopied(company.id); setTimeout(() => setCopied(null), 2000) }}>
                    {copied === company.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-stone-500 hover:text-stone-300" />}
                  </button>
                </div>
              ) : (
                <div className="bg-gov-700 border border-stone-800 rounded-lg px-3 py-1.5">
                  <span className="font-mono text-stone-700 tracking-[0.3em] text-base">••••</span>
                </div>
              )}
              <button onClick={() => regeneratePin(company.id, customPins[company.id] || undefined)}
                disabled={regenerating === company.id}
                className="icon-btn disabled:opacity-40">
                {regenerating === company.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Logs View ────────────────────────────────────────────────────────────────
const LOG_CATEGORIES = [
  { id: 'all', label: 'Tous', icon: '📋' },
  { id: 'connexion', label: 'Connexions', icon: '🔓' },
  { id: 'fichier', label: 'Fichiers', icon: '📁' },
  { id: 'dossier', label: 'Dossiers', icon: '🗂️' },
  { id: 'admin', label: 'Administration', icon: '⚙️' },
  { id: 'consultation', label: 'Consultations', icon: '👁️' },
] as const

function LogsView() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/logs?limit=500').then(r => r.json()).then(setLogs).finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter(log => {
    const meta = ACTION_LABELS[log.action]
    if (category !== 'all' && meta?.category !== category) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        log.userLabel?.toLowerCase().includes(q) ||
        log.fileName?.toLowerCase().includes(q) ||
        log.companyName?.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q) ||
        meta?.label?.toLowerCase().includes(q)
      )
    }
    return true
  })

  if (loading) return <PageLoader />

  return (
    <div className="space-y-4">
      <div className="search-bar">
        <Search className="search-icon" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par utilisateur, fichier, entreprise..."
          className="search-input" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {LOG_CATEGORIES.map(cat => {
          const count = cat.id === 'all' ? logs.length : logs.filter(l => ACTION_LABELS[l.action]?.category === cat.id).length
          return (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`filter-chip ${category === cat.id ? 'filter-chip-active' : 'filter-chip-inactive'}`}>
              <span>{cat.icon}</span>{cat.label}
              <span className="opacity-50 ml-1 font-mono text-xs">{count}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-1.5">
        {filtered.map((log, i) => {
          const meta = ACTION_LABELS[log.action] || { label: log.action, color: 'text-stone-400', icon: '📋', category: 'other' }
          return (
            <div key={log.id} className="log-item" style={{ animationDelay: `${Math.min(i, 20) * 20}ms` }}>
              <span className="text-lg flex-shrink-0">{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                  <span className="text-xs text-stone-400 font-semibold">{log.userLabel}</span>
                  {log.companyName && <span className="tag">{log.companyName}</span>}
                  {log.fileName && <span className="tag truncate max-w-40">📄 {log.fileName}</span>}
                </div>
                {log.details && <div className="text-xs text-stone-600 mt-0.5">{log.details}</div>}
              </div>
              <div className="text-xs text-stone-600 text-right flex-shrink-0">
                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: fr })}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="empty-state">
            <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>{search ? `Aucun résultat pour "${search}"` : 'Aucun journal dans cette catégorie'}</p>
          </div>
        )}
      </div>
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
  if (loading) return <PageLoader />
  const loginLogs = logs.filter(l => l.action === 'LOGIN_SUCCESS' || l.action === 'LOGIN_FAILED')

  return (
    <div className="space-y-6">
      <div className="info-card border-stone-700/40 flex items-center gap-2">
        <Lock className="w-3.5 h-3.5 text-stone-600" />
        <p className="text-xs text-stone-500">Les adresses IP sont hachées de façon irréversible — jamais stockées en clair.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(stats).map(([name, data]) => (
          <div key={name} className="panel">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
                {name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-white font-semibold text-sm">{name}</span>
            </div>
            <div className="text-2xl font-bold text-white mb-0.5"><AnimatedCounter value={data.count} /></div>
            <div className="text-xs text-stone-500">connexions réussies</div>
            <div className="text-xs text-stone-600 mt-1">{formatDistanceToNow(new Date(data.lastLogin), { addSuffix: true, locale: fr })}</div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {loginLogs.slice(0, 100).map(log => (
          <div key={log.id} className="log-item">
            <span className="text-lg">{log.action === 'LOGIN_SUCCESS' ? '🔓' : '🚫'}</span>
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${log.action === 'LOGIN_SUCCESS' ? 'text-emerald-400' : 'text-red-400'}`}>{log.userLabel}</span>
              {log.ip && <span className="text-xs text-stone-700 ml-2 font-mono bg-gov-800 px-1.5 py-0.5 rounded" title="IP hachée SHA-256">#{log.ip}</span>}
            </div>
            <div className="text-xs text-stone-600 text-right">
              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: fr })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Folder Manager ───────────────────────────────────────────────────────────
function FolderManager({ myRole, myPermissions }: { myRole: string; myPermissions: Permissions | null }) {
  const canViewPins = myRole === 'superadmin' || (myPermissions?.canViewFolderPins ?? false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [folders, setFolders] = useState<Record<string, { name: string; locked: boolean; companyName: string }[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<{ id: string; name: string; companyId: string } | null>(null)
  const [lockPin, setLockPin] = useState('')
  const [lockAction, setLockAction] = useState<'lock' | 'unlock'>('lock')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [revealedPins, setRevealedPins] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/companies/list').then(r => r.json()).then(async (data: Company[]) => {
      if (!Array.isArray(data)) return
      setCompanies(data)
      const res: Record<string, { name: string; locked: boolean; companyName: string }[]> = {}
      await Promise.all(data.map(async c => {
        const f = await fetch(`/api/files/folders?companyId=${c.id}`).then(r => r.json())
        if (Array.isArray(f)) res[c.id] = f.map((folder: any) => ({ name: folder.name, locked: !!folder.lockPin, companyName: c.name }))
      }))
      setFolders(res)
    }).finally(() => setLoading(false))
  }, [])

  async function fetchFolderPin(folderId: string) {
    const res = await fetch(`/api/files/folders/lock?folderId=${folderId}&reveal=true`)
    const data = await res.json()
    if (data.pin) setRevealedPins(prev => ({ ...prev, [folderId]: data.pin }))
  }

  async function lockFolder() {
    if (!selectedFolder || !lockPin || lockPin.length !== 4) return setError('PIN à 4 chiffres requis')
    setSaving(true); setError('')
    const res = await fetch('/api/files/folders/lock', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: selectedFolder.id, pin: lockPin }),
    })
    if (res.ok) { setSelectedFolder(null); setLockPin('') } else setError('Erreur lors du verrouillage')
    setSaving(false)
  }

  async function unlockFolder() {
    if (!selectedFolder) return
    setSaving(true); setError('')
    const res = await fetch('/api/files/folders/lock', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: selectedFolder.id }),
    })
    if (res.ok) { setSelectedFolder(null) } else setError('Erreur lors du déverrouillage')
    setSaving(false)
  }

  if (loading) return <PageLoader />
  const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="search-bar">
        <Search className="search-icon" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une entreprise..." className="search-input" />
      </div>
      <div className="space-y-4">
        {filteredCompanies.map(company => {
          const compFolders = folders[company.id] || []
          const locked = compFolders.filter(f => f.locked)
          if (compFolders.length === 0) return null
          return (
            <div key={company.id} className="panel">
              <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => setSelectedCompany(selectedCompany === company.id ? null : company.id)}>
                <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: (company as any).accentColor || '#888' }} />
                <div className="flex-1">
                  <div className="text-white font-semibold text-sm">{company.name}</div>
                  <div className="text-xs text-stone-500">{compFolders.length} dossiers · {locked.length} verrouillé{locked.length > 1 ? 's' : ''}</div>
                </div>
                <ChevronRight className={`w-4 h-4 text-stone-600 transition-transform ${selectedCompany === company.id ? 'rotate-90' : ''}`} />
              </div>
              {selectedCompany === company.id && (
                <div className="space-y-2 animate-slide-down">
                  {compFolders.map((folder: any) => (
                    <div key={folder.id} className="flex items-center gap-3 bg-gov-800/50 rounded-xl px-4 py-3 border border-stone-800">
                      <span className="text-base">{folder.locked ? '🔒' : '📁'}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{folder.name}</div>
                        {folder.locked && canViewPins && (
                          <div className="flex items-center gap-2 mt-1">
                            {revealedPins[folder.id] ? (
                              <span className="font-mono text-amber-400 text-xs bg-amber-950/30 border border-amber-700/30 px-2 py-0.5 rounded">{revealedPins[folder.id]}</span>
                            ) : (
                              <button onClick={() => fetchFolderPin(folder.id)} className="text-xs text-stone-500 hover:text-amber-400 transition-colors">Voir le PIN →</button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {!folder.locked && (
                          <button onClick={() => { setSelectedFolder({ id: folder.id, name: folder.name, companyId: company.id }); setLockAction('lock') }}
                            className="icon-btn text-amber-400/60 hover:text-amber-400">
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                        {folder.locked && (
                          <button onClick={() => { setSelectedFolder({ id: folder.id, name: folder.name, companyId: company.id }); setLockAction('unlock') }}
                            className="icon-btn text-emerald-400/60 hover:text-emerald-400">
                            <Unlock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedFolder && (
        <div className="modal-overlay">
          <div className="modal-card animate-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                {lockAction === 'lock' ? <><Lock className="w-4 h-4 text-amber-400" />Verrouiller</> : <><Unlock className="w-4 h-4 text-emerald-400" />Déverrouiller</>}
                {' — '}{selectedFolder.name}
              </h2>
              <button onClick={() => { setSelectedFolder(null); setLockPin(''); setError('') }} className="modal-close">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {lockAction === 'lock' && (
                <div className="form-group">
                  <label className="form-label">Code PIN à 4 chiffres</label>
                  <input type="text" maxLength={4} value={lockPin}
                    onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setLockPin(e.target.value) }}
                    className="form-input font-mono text-center text-lg tracking-widest text-amber-400" placeholder="1234" />
                </div>
              )}
              {lockAction === 'unlock' && (
                <p className="text-stone-400 text-sm">Le dossier sera déverrouillé et accessible sans code PIN.</p>
              )}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button onClick={lockAction === 'lock' ? lockFolder : unlockFolder} disabled={saving}
                  className={lockAction === 'lock' ? 'btn-warning flex-1' : 'btn-primary flex-1'}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : lockAction === 'lock' ? 'Verrouiller' : 'Déverrouiller'}
                </button>
                <button onClick={() => { setSelectedFolder(null); setLockPin(''); setError('') }} className="btn-ghost flex-1">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Company Creator ──────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { value: 'gouvernement', label: '🏛️ Gouvernement', desc: 'Police, justice, administration...' },
  { value: 'restauration', label: '🍔 Restauration', desc: 'Restaurants, fast-food, cafés...' },
  { value: 'evenementiel', label: '🎭 Évènementiel', desc: 'Clubs, bars, événements...' },
  { value: 'utilitaire', label: '🔧 Utilitaire', desc: 'Garages, médias, services...' },
  { value: 'production', label: '🏭 Production', desc: 'Industrie, logistique, énergie...' },
]

const PRESET_COLORS = [
  { bg: '#0a1628', accent: '#1e40af', label: 'Bleu nuit' },
  { bg: '#0a0a1a', accent: '#7c3aed', label: 'Violet' },
  { bg: '#1a0a0a', accent: '#dc2626', label: 'Rouge' },
  { bg: '#0f1a0f', accent: '#166534', label: 'Vert' },
  { bg: '#150800', accent: '#f97316', label: 'Orange' },
  { bg: '#0a0800', accent: '#d97706', label: 'Or' },
  { bg: '#000a15', accent: '#0ea5e9', label: 'Cyan' },
  { bg: '#100015', accent: '#a855f7', label: 'Mauve' },
  { bg: '#150808', accent: '#f472b6', label: 'Rose' },
  { bg: '#0f0800', accent: '#b45309', label: 'Brun' },
]

function CompanyCreator() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [customBg, setCustomBg] = useState('#0a0a14')
  const [customAccent, setCustomAccent] = useState('#6366f1')
  const [useCustom, setUseCustom] = useState(false)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ company: { name: string; slug: string; pin: string } } | null>(null)
  const [pinConfirmed, setPinConfirmed] = useState(false)

  const bgColor = useCustom ? customBg : (selectedPreset !== null ? PRESET_COLORS[selectedPreset].bg : '#0a0a14')
  const accentColor = useCustom ? customAccent : (selectedPreset !== null ? PRESET_COLORS[selectedPreset].accent : '#6366f1')
  const slug = name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  async function createCompany() {
    if (!name.trim() || !category) { setError('Nom et catégorie requis'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/admin/companies', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, color: bgColor, accentColor, description }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setResult(data); setStep(3); setSaving(false)
  }

  function reset() {
    setStep(1); setName(''); setCategory(''); setSelectedPreset(null)
    setUseCustom(false); setDescription(''); setResult(null); setPinConfirmed(false); setError('')
  }

  if (step === 3 && result) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="panel border-emerald-500/20 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-white font-bold text-xl font-serif mb-1">Entreprise créée !</h2>
          <p className="text-stone-400 text-sm mb-6">"{result.company.name}" est maintenant accessible.</p>

          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-5 mb-5">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">⚠️ Code PIN — À noter maintenant</p>
            <div className="flex gap-3 justify-center mb-3">
              {result.company.pin.split('').map((d, i) => (
                <div key={i} className="w-14 h-16 rounded-xl bg-gov-800 border-2 border-amber-500/40 flex items-center justify-center text-2xl font-mono font-bold text-amber-400">
                  {d}
                </div>
              ))}
            </div>
            <p className="text-stone-500 text-xs">Ce code ne sera plus jamais affiché en clair.</p>
          </div>

          {!pinConfirmed ? (
            <div className="space-y-3">
              <p className="text-stone-400 text-sm">Confirmez avoir noté le PIN pour continuer.</p>
              <button onClick={() => setPinConfirmed(true)} className="btn-primary w-full">
                <Check className="w-4 h-4" />J'ai noté le PIN
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="panel text-left space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-stone-500">Nom</span><span className="text-white font-medium">{result.company.name}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Slug</span><span className="text-stone-300 font-mono text-xs">{result.company.slug}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">URL</span>
                  <a href={`/company/${result.company.slug}`} target="_blank" className="text-amber-400 hover:underline text-xs font-mono">/company/{result.company.slug}</a>
                </div>
              </div>
              <div className="flex gap-3">
                <a href={`/company/${result.company.slug}`} target="_blank"
                  className="btn-primary flex-1 text-center justify-center">
                  Ouvrir l'entreprise
                </a>
                <button onClick={reset} className="btn-ghost flex-1">Créer une autre</button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center gap-4 mb-2">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${step >= s ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-gov-800 border-stone-700 text-stone-600'}`}>{s}</div>
            <span className={`text-sm ${step >= s ? 'text-stone-300' : 'text-stone-600'}`}>
              {s === 1 ? 'Informations' : 'Apparence'}
            </span>
            {s < 2 && <ChevronRight className="w-4 h-4 text-stone-700" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="panel space-y-5">
          <h3 className="text-white font-semibold font-serif">Informations de l'entreprise</h3>

          <div className="form-group">
            <label className="form-label">Nom de l'entreprise *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="Ex : Maze Bank, LS Customs..."
              className="form-input" />
            {name.trim() && (
              <p className="text-xs text-stone-600 mt-1">Slug : <span className="font-mono text-stone-500">{slug}</span></p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Catégorie *</label>
            <div className="grid grid-cols-1 gap-2">
              {CATEGORY_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setCategory(opt.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm border transition-all text-left ${category === opt.value ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-stone-700 bg-gov-800 text-stone-400 hover:border-stone-600'}`}>
                  <span className="text-lg">{opt.label.split(' ')[0]}</span>
                  <div>
                    <div className="font-medium">{opt.label.split(' ').slice(1).join(' ')}</div>
                    <div className="text-xs opacity-60">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description (optionnel)</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Courte description de l'entreprise..."
              className="form-input" />
          </div>

          {error && <p className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" />{error}</p>}
          <button onClick={() => { if (!name.trim() || !category) { setError('Nom et catégorie requis'); return }; setError(''); setStep(2) }}
            className="btn-primary w-full">Suivant →</button>
        </div>
      )}

      {step === 2 && (
        <div className="panel space-y-5">
          <h3 className="text-white font-semibold font-serif">Apparence</h3>

          {/* Aperçu */}
          <div className="rounded-xl overflow-hidden border border-white/10">
            <div className="h-16 flex items-center px-5 gap-3" style={{ backgroundColor: bgColor }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
              <span className="font-semibold text-white text-sm">{name || 'Nom de l\'entreprise'}</span>
              <span className="text-xs px-2 py-1 rounded-full ml-auto" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>Aperçu</span>
            </div>
            <div className="px-5 py-3 text-xs" style={{ backgroundColor: bgColor, color: `${accentColor}60` }}>
              {description || "Description de l'entreprise..."}
            </div>
          </div>

          {/* Palettes */}
          <div>
            <label className="form-label mb-2">Palettes prédéfinies</label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((preset, i) => (
                <button key={i} onClick={() => { setSelectedPreset(i); setUseCustom(false) }}
                  className={`h-10 rounded-lg border-2 transition-all relative overflow-hidden ${selectedPreset === i && !useCustom ? 'border-amber-400 scale-105' : 'border-transparent hover:border-stone-600'}`}
                  style={{ backgroundColor: preset.bg }}
                  title={preset.label}>
                  <div className="absolute right-1.5 bottom-1.5 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.accent }} />
                </button>
              ))}
            </div>
          </div>

          {/* Couleurs custom */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setUseCustom(!useCustom)}
                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all ${useCustom ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-stone-700 text-stone-500 hover:border-stone-600'}`}>
                <div className={`w-2 h-2 rounded-full ${useCustom ? 'bg-amber-400' : 'bg-stone-600'}`} />
                Couleurs personnalisées
              </button>
            </div>
            {useCustom && (
              <div className="grid grid-cols-2 gap-3 animate-slide-down">
                <div className="form-group">
                  <label className="form-label">Fond</label>
                  <div className="flex gap-2">
                    <input type="color" value={customBg} onChange={e => setCustomBg(e.target.value)} className="w-10 h-10 rounded-lg border border-stone-700 cursor-pointer bg-transparent" />
                    <input value={customBg} onChange={e => setCustomBg(e.target.value)} className="form-input flex-1 font-mono text-sm" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Accent</label>
                  <div className="flex gap-2">
                    <input type="color" value={customAccent} onChange={e => setCustomAccent(e.target.value)} className="w-10 h-10 rounded-lg border border-stone-700 cursor-pointer bg-transparent" />
                    <input value={customAccent} onChange={e => setCustomAccent(e.target.value)} className="form-input flex-1 font-mono text-sm" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5" />{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-ghost">← Retour</button>
            <button onClick={createCompany} disabled={saving || (!useCustom && selectedPreset === null)}
              className="btn-primary flex-1 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "🏢 Créer l'entreprise"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Companies List ───────────────────────────────────────────────────────────
function CompaniesList() {
  const [search, setSearch] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [role, setRole] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.role || ''))
    fetch('/api/companies/list').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setCompanies(data)
    }).finally(() => setLoading(false))
  }, [])

  async function deleteCompany(company: Company) {
    if (!confirm(`Supprimer définitivement "${company.name}" ? Cette action est irréversible.`)) return
    setDeleting(company.id)
    const res = await fetch('/api/admin/companies', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: company.id }),
    })
    if (res.ok) setCompanies(prev => prev.filter(c => c.id !== company.id))
    setDeleting(null)
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6">
      <div className="search-bar">
        <Search className="search-icon" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="search-input" />
      </div>
      {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
        const filtered = companies.filter(c => c.category === cat && c.name.toLowerCase().includes(search.toLowerCase()))
        if (!filtered.length) return null
        return (
          <div key={cat}>
            <div className="section-title">
              <span>{CATEGORY_ICONS[cat]}</span>{label}
              <span className="section-count">{filtered.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map(c => (
                <div key={c.id} className="flex items-center gap-3 panel hover:border-white/10 transition-all group">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: (c as any).accentColor || '#888' }} />
                  <Link href={`/company/${c.slug}`} className="text-sm text-stone-300 group-hover:text-white transition-colors flex-1 min-w-0 truncate font-medium">
                    {c.name}
                  </Link>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/company/${c.slug}`} className="icon-btn">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    {role === 'superadmin' && (
                      <button onClick={() => deleteCompany(c)} disabled={deleting === c.id}
                        className="icon-btn icon-btn-danger disabled:opacity-40">
                        {deleting === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {companies.length === 0 && (
        <div className="empty-state">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Aucune entreprise</p>
        </div>
      )}
    </div>
  )
}

// ─── Health Bar ───────────────────────────────────────────────────────────────
function HealthBar({ score, animated = true }: { score: number; animated?: boolean }) {
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => {
    if (!animated) { setDisplayed(score); return }
    const start = performance.now()
    const duration = 1200 + Math.random() * 400
    const animate = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setDisplayed(Math.round((1 - Math.pow(1 - p, 3)) * score))
      if (p < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [score, animated])

  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  const label = score >= 70 ? 'Actif' : score >= 40 ? 'Modéré' : 'Inactif'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-gov-700 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${displayed}%`, backgroundColor: color, transition: 'width 0.05s linear' }} />
      </div>
      <span className="text-xs font-mono font-bold w-7 text-right" style={{ color }}>{displayed}</span>
      <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${color}20`, color }}>{label}</span>
    </div>
  )
}

interface CompanyScore {
  id: string; name: string; slug: string; category: string; accentColor: string
  score: number; status: string; totalFiles: number; filesLast7d: number
  connexionsLast7d: number; daysSinceActivity: number | null; lastActivity: string | null
}

// ─── Dashboard Home ───────────────────────────────────────────────────────────
function DashboardHome({ stats }: { stats: Record<string, unknown> | null }) {
  const [animKey, setAnimKey] = useState(0)
  if (!stats) return <PageLoader />

  const recentLogs = (stats.recentLogs as ActivityLog[]) || []
  const recentFiles = (stats.recentFiles as Array<{ id: string; name: string; companySlug: string; uploadedAt: string }>) || []
  const companyScores = (stats.companyScores as CompanyScore[]) || []
  const alerts = stats.alerts as { inactive: number; noFiles: number; topActive: string[] } | undefined
  const avgScore = companyScores.length > 0
    ? Math.round(companyScores.reduce((a, c) => a + c.score, 0) / companyScores.length) : 0

  const statCards = [
    { label: 'Fichiers totaux', value: stats.totalFiles as number, icon: FileText, color: '#60a5fa', bg: 'bg-blue-500/10', border: 'border-blue-500/15' },
    { label: 'Entreprises', value: stats.totalCompanies as number, icon: Building2, color: '#34d399', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15' },
    { label: 'Score DEE moyen', value: `${avgScore}/100`, icon: TrendingUp, color: avgScore >= 70 ? '#34d399' : avgScore >= 40 ? '#f59e0b' : '#f87171', bg: 'bg-white/5', border: 'border-white/5' },
    { label: 'Administrateurs', value: stats.totalAdmins as number, icon: Shield, color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/15' },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.label} className={`stat-card ${s.bg} ${s.border}`} style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: s.color, opacity: 0.6 }} />
              </div>
              <div className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: 'var(--font-playfair)' }}>
                {typeof s.value === 'number' ? <AnimatedCounter value={s.value} duration={1200} /> : s.value}
              </div>
              <div className="text-xs text-stone-500 font-medium">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Alertes */}
      {alerts && (alerts.inactive > 0 || alerts.noFiles > 0) && (
        <div className="panel border-amber-500/20 bg-amber-950/5 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Alertes automatiques</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.inactive > 0 && (
              <span className="tag tag-red">{alerts.inactive} entreprise{alerts.inactive > 1 ? 's' : ''} inactive{alerts.inactive > 1 ? 's' : ''}</span>
            )}
            {alerts.noFiles > 0 && (
              <span className="tag tag-amber">{alerts.noFiles} entreprise{alerts.noFiles > 1 ? 's' : ''} sans fichier</span>
            )}
            {alerts.topActive.length > 0 && (
              <span className="tag tag-green">Top : {alerts.topActive.join(', ')}</span>
            )}
          </div>
        </div>
      )}

      {/* Santé économique */}
      <div className="panel animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            Indice de santé économique
          </h3>
          <button onClick={() => setAnimKey(k => k + 1)} className="text-xs text-stone-600 hover:text-amber-400 flex items-center gap-1 transition-colors">
            <RefreshCw className="w-3 h-3" />Réactualiser
          </button>
        </div>
        {companyScores.length === 0 ? (
          <div className="empty-state"><BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>Aucune entreprise à analyser</p></div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {companyScores.map((c, i) => (
              <div key={c.id} className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-gov-800/50 transition-colors">
                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: c.accentColor || '#888' }} />
                <div className="min-w-0 w-32 flex-shrink-0">
                  <div className="text-sm font-medium text-white truncate">{c.name}</div>
                  <div className="text-xs text-stone-600 capitalize">{CATEGORY_LABELS[c.category] || c.category}</div>
                </div>
                <div className="flex-1">
                  <HealthBar key={`${animKey}-${c.id}`} score={c.score} animated={i < 10} />
                </div>
                <Link href={`/company/${c.slug}`} className="text-stone-700 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-400" />Derniers fichiers
          </h3>
          <div className="space-y-2">
            {recentFiles.slice(0, 6).map(f => (
              <div key={f.id} className="flex items-center gap-3 text-sm group">
                <div className="w-7 h-7 rounded-lg bg-gov-700 border border-stone-800 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-3.5 h-3.5 text-stone-500" />
                </div>
                <span className="text-stone-300 truncate flex-1 group-hover:text-white transition-colors">{f.name}</span>
                <span className="tag text-xs">{f.companySlug}</span>
              </div>
            ))}
            {recentFiles.length === 0 && <div className="empty-state text-xs py-6"><Upload className="w-6 h-6 mx-auto mb-2 opacity-20" /><p>Aucun fichier</p></div>}
          </div>
        </div>

        <div className="panel animate-fade-in" style={{ animationDelay: '380ms' }}>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />Activité récente
          </h3>
          <div className="space-y-2">
            {recentLogs.slice(0, 6).map(log => {
              const meta = ACTION_LABELS[log.action] || { label: log.action, color: 'text-stone-400', icon: '📋' }
              return (
                <div key={log.id} className="flex items-center gap-3 text-sm">
                  <span className="text-base w-6 text-center">{meta.icon}</span>
                  <span className={`flex-1 ${meta.color} font-medium text-xs`}>{meta.label}</span>
                  <span className="text-xs text-stone-600">{log.userLabel}</span>
                </div>
              )
            })}
            {recentLogs.length === 0 && <div className="empty-state text-xs py-6"><Activity className="w-6 h-6 mx-auto mb-2 opacity-20" /><p>Aucune activité</p></div>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page Loader ──────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
        <span className="text-xs text-stone-600 font-medium">Chargement...</span>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState('dashboard')
  const [role, setRole] = useState('')
  const [userId, setUserId] = useState('')
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [checking, setChecking] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.error || d.role === 'company') { router.push('/login'); return }
      setRole(d.role)
      setUserId(d.userId ?? '')
      setPermissions(d.permissions ?? DEFAULT_PERMISSIONS[d.role as UserRole])
      setChecking(false)
    })
  }, [router])

  useEffect(() => {
    if (tab === 'dashboard') fetch('/api/admin/stats').then(r => r.json()).then(setStats)
  }, [tab])

  if (checking) return (
    <div className="min-h-screen bg-gov-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
        <span className="text-stone-500 text-sm">Authentification...</span>
      </div>
    </div>
  )

  const TAB_TITLES: Record<string, string> = {
    dashboard: 'Tableau de bord',
    companies: 'Entreprises',
    logs: "Journaux d'activité",
    pins: 'Gestion des PINs',
    folders: 'Gestion des dossiers',
    'companies-new': 'Nouvelle entreprise',
    admins: 'Utilisateurs',
    connexions: 'Connexions',
  }

  const TAB_ICONS: Record<string, string> = {
    dashboard: '🏛️', companies: '🏢', logs: '📋', pins: '🔑',
    folders: '📁', 'companies-new': '➕', admins: '👥', connexions: '🔓',
  }

  return (
    <>
      {/* Dashboard styles */}
      <style jsx global>{`
        /* ── Layout ── */
        .sidebar-container {
          flex-shrink: 0;
          background: rgba(5, 8, 16, 0.95);
          border-right: 1px solid rgba(255,255,255,0.04);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          transition: width 0.25s cubic-bezier(0.4,0,0.2,1);
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
        }
        .sidebar-expanded { width: 240px; }
        .sidebar-collapsed { width: 64px; }

        /* ── Sidebar header ── */
        .sidebar-header {
          padding: 20px 16px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-height: 64px;
        }
        .sidebar-logo {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(245,181,32,0.08);
          border: 1px solid rgba(245,181,32,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sidebar-toggle-btn {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #57534e;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .sidebar-toggle-btn:hover { background: rgba(255,255,255,0.06); color: #a8a29e; }

        /* ── Nav items ── */
        .nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 10px;
          transition: all 0.15s;
          position: relative;
          cursor: pointer;
          font-family: var(--font-inter);
        }
        .nav-item-collapsed { justify-content: center; padding: 8px; }
        .nav-item-active { background: rgba(245,181,32,0.08); color: #fcd34d; }
        .nav-item-inactive { color: #78716c; }
        .nav-item-inactive:hover { background: rgba(255,255,255,0.04); color: #d6d3d1; }
        .nav-item-indicator {
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 16px;
          background: #f59e0b;
          border-radius: 0 2px 2px 0;
          transition: opacity 0.15s;
        }

        /* ── Panels & cards ── */
        .panel {
          background: rgba(13, 18, 40, 0.6);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 20px;
        }
        .stat-card {
          border-radius: 14px;
          padding: 20px;
          border: 1px solid;
          animation: fadeSlideUp 0.4s ease both;
        }
        .info-card {
          background: rgba(13,18,40,0.4);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 12px 16px;
        }
        .user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(13,18,40,0.5);
          border: 1px solid rgba(255,255,255,0.05);
          transition: border-color 0.15s;
        }
        .user-card:hover { border-color: rgba(255,255,255,0.08); }
        .user-avatar {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700;
          border: 1px solid;
          flex-shrink: 0;
        }

        /* ── Modals ── */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          padding: 16px;
        }
        .modal-card {
          background: rgba(8,12,24,0.98);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          width: 100%; max-width: 480px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
        }
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: space-between;
        }
        .modal-title {
          color: white; font-weight: 600; font-size: 15px;
          display: flex; align-items: center; gap: 8px;
        }
        .modal-close {
          color: #57534e; font-size: 18px; line-height: 1;
          transition: color 0.15s; padding: 4px;
        }
        .modal-close:hover { color: white; }
        .animate-modal { animation: scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both; }

        /* ── Forms ── */
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 11px; font-weight: 600; color: #78716c; text-transform: uppercase; letter-spacing: 0.06em; }
        .form-input {
          width: 100%;
          background: rgba(8,12,24,0.8);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          color: white;
          outline: none;
          transition: border-color 0.15s;
          font-family: var(--font-inter);
        }
        .form-input:focus { border-color: rgba(245,181,32,0.4); }
        .form-input::placeholder { color: #44403c; }
        .input-wrapper { position: relative; }
        .input-eye {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%); color: #57534e;
          transition: color 0.15s;
        }
        .input-eye:hover { color: #a8a29e; }

        /* ── Buttons ── */
        .btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(135deg, #b8890a, #f5c842, #b8890a);
          background-size: 200% auto;
          color: #050810; font-weight: 600; font-size: 13px;
          padding: 10px 20px; border-radius: 10px;
          transition: all 0.3s; cursor: pointer;
        }
        .btn-primary:hover { background-position: right center; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-ghost {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          color: #78716c; font-size: 13px; font-weight: 500;
          padding: 10px 20px; border-radius: 10px;
          transition: all 0.15s; cursor: pointer;
        }
        .btn-ghost:hover { border-color: rgba(255,255,255,0.15); color: #d6d3d1; }
        .btn-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #a8a29e; font-size: 12px; font-weight: 500;
          padding: 7px 14px; border-radius: 8px;
          transition: all 0.15s; cursor: pointer;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.07); color: #d6d3d1; }
        .btn-warning {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.25);
          color: #fbbf24; font-size: 13px; font-weight: 600;
          padding: 10px 20px; border-radius: 10px;
          transition: all 0.15s; cursor: pointer;
        }
        .btn-warning:hover { background: rgba(245,158,11,0.18); }

        /* ── Icon buttons ── */
        .icon-btn {
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          color: #57534e;
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.15s; cursor: pointer;
        }
        .icon-btn:hover { background: rgba(255,255,255,0.05); color: #a8a29e; border-color: rgba(255,255,255,0.06); }
        .icon-btn-danger:hover { background: rgba(239,68,68,0.08); color: #f87171; border-color: rgba(239,68,68,0.15); }

        /* ── Search bar ── */
        .search-bar { position: relative; }
        .search-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          width: 16px; height: 16px; color: #57534e;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 10px 16px 10px 42px;
          background: rgba(8,12,24,0.7);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          font-size: 14px; color: white;
          outline: none; transition: border-color 0.15s;
          font-family: var(--font-inter);
        }
        .search-input:focus { border-color: rgba(245,181,32,0.3); }
        .search-input::placeholder { color: #44403c; }

        /* ── Tags & chips ── */
        .tag {
          font-size: 11px; font-weight: 500;
          padding: 2px 8px; border-radius: 6px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.07);
          color: #78716c;
        }
        .tag-red { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.15); color: #f87171; }
        .tag-amber { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.15); color: #fbbf24; }
        .tag-green { background: rgba(52,211,153,0.08); border-color: rgba(52,211,153,0.15); color: #34d399; }
        .filter-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 500;
          border: 1px solid; transition: all 0.15s; cursor: pointer;
        }
        .filter-chip-active { border-color: rgba(245,181,32,0.35); background: rgba(245,181,32,0.08); color: #fcd34d; }
        .filter-chip-inactive { border-color: rgba(255,255,255,0.07); color: #57534e; }
        .filter-chip-inactive:hover { border-color: rgba(255,255,255,0.12); color: #a8a29e; }
        .role-pill {
          padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 500;
          border: 1px solid; transition: all 0.15s; cursor: pointer;
        }
        .role-pill-inactive { border-color: rgba(255,255,255,0.08); color: #78716c; }
        .role-pill-inactive:hover { border-color: rgba(255,255,255,0.15); color: #d6d3d1; }
        .role-pill-active-emerald { border-color: rgba(52,211,153,0.35); background: rgba(52,211,153,0.08); color: #34d399; }
        .role-pill-active-blue { border-color: rgba(96,165,250,0.35); background: rgba(96,165,250,0.08); color: #60a5fa; }

        /* ── Log items ── */
        .log-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 10px 14px; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.04);
          background: rgba(13,18,40,0.4);
          transition: background 0.15s;
          animation: fadeIn 0.3s ease both;
        }
        .log-item:hover { background: rgba(13,18,40,0.7); }

        /* ── Section titles ── */
        .section-title {
          display: flex; align-items: center; gap-8px;
          font-size: 11px; font-weight: 700;
          color: #57534e; text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 10px;
          gap: 8px;
        }
        .section-count {
          font-size: 10px; padding: 1px 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px; color: #44403c;
        }

        /* ── Empty state ── */
        .empty-state {
          text-align: center; padding: 48px 24px;
          font-size: 13px; color: #44403c;
        }

        /* ── Animations ── */
        .fade-in { animation: fadeIn 0.2s ease both; }
        .animate-slide-down { animation: slideDown 0.2s ease both; }
        .animate-fade-in { animation: fadeSlideUp 0.4s ease both; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div className="min-h-screen bg-gov-900 flex">
        <SidebarNav
          active={tab} role={role} permissions={permissions}
          onTabChange={setTab} collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
        />
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="border-b border-white/5 px-8 py-4 flex items-center justify-between sticky top-0 z-10"
            style={{ background: 'rgba(5,8,16,0.9)', backdropFilter: 'blur(16px)' }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{TAB_ICONS[tab] || '📋'}</span>
                <div>
                  <h1 className="font-bold text-white text-base" style={{ fontFamily: 'var(--font-playfair)' }}>
                    {TAB_TITLES[tab] || tab}
                  </h1>
                  <p className="text-xs text-stone-600">DEE — État de San Andreas</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-stone-500 hover:text-stone-300 border border-transparent hover:border-white/08 transition-all">
                <Globe className="w-3.5 h-3.5" />Site public
              </a>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-8 overflow-auto">
            <div key={tab} className="animate-fade-in">
              {tab === 'dashboard' && <DashboardHome stats={stats} />}
              {tab === 'companies' && <CompaniesList />}
              {tab === 'logs' && <LogsView />}
              {tab === 'pins' && <PinManager />}
              {tab === 'folders' && <FolderManager myRole={role} myPermissions={permissions} />}
              {tab === 'companies-new' && <CompanyCreator />}
              {tab === 'admins' && <UserManager myRole={role} myUserId={userId} />}
              {tab === 'connexions' && role === 'superadmin' && <ConnexionsAdmins />}
<<<<<<< Updated upstream
=======
              {tab === 'bag' && <BAGManager myRole={role as UserRole} myUserId={userId} />}
>>>>>>> Stashed changes
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

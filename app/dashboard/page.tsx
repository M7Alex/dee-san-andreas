'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, FileText, Building2, Shield, Key,
  ScrollText, LogOut, Search, Upload, Clock, Users,
  RefreshCw, Loader2, Copy, Check, Plus, Trash2,
  Eye, EyeOff, ChevronRight, UserCheck, Settings,
  CheckSquare, Square, Lock, Unlock, Folder, FolderLock, X, Filter
} from 'lucide-react'
import { ActivityLog, Company, AdminUser, Permissions, DEFAULT_PERMISSIONS, UserRole, CustomFolder } from '@/types'
import { CATEGORY_LABELS, CATEGORY_ICONS, COMPANIES } from '@/lib/companies-data'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const ACTION_LABELS: Record<string, { label: string; color: string; icon: string; category: string }> = {
  LOGIN_SUCCESS: { label: 'Connexion', color: 'text-green-400', icon: '🔓', category: 'connexion' },
  LOGIN_FAILED: { label: 'Échec connexion', color: 'text-red-400', icon: '🚫', category: 'connexion' },
  COMPANY_ACCESS: { label: 'Accès entreprise', color: 'text-blue-400', icon: '🏢', category: 'connexion' },
  FILE_UPLOAD: { label: 'Upload fichier', color: 'text-gold-400', icon: '📤', category: 'fichier' },
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
  FOLDER_UNLOCKED: { label: 'Dossier déverrouillé', color: 'text-green-300', icon: '🔓', category: 'dossier' },
  FILE_VIEW: { label: 'Fichier consulté', color: 'text-sky-400', icon: '👁️', category: 'consultation' },
  FILE_DOWNLOAD: { label: 'Fichier téléchargé', color: 'text-sky-300', icon: '⬇️', category: 'consultation' },
}

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-gold-500/20 text-gold-400 border border-gold-500/30',
  admin: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  consultant: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
}

const PERM_LABELS: { key: keyof Permissions; label: string; group: string; desc: string }[] = [
  { key: 'canUploadFiles', label: 'Upload de fichiers', group: '📁 Fichiers', desc: 'Peut déposer des fichiers dans les dossiers entreprise' },
  { key: 'canDownloadFiles', label: 'Téléchargement de fichiers', group: '📁 Fichiers', desc: 'Peut télécharger les fichiers existants' },
  { key: 'canDeleteFiles', label: 'Suppression de fichiers', group: '📁 Fichiers', desc: 'Peut supprimer des fichiers définitivement' },
  { key: 'canPinFiles', label: 'Épingler des fichiers', group: '📁 Fichiers', desc: 'Peut marquer un fichier comme épinglé/prioritaire' },
  { key: 'canViewAllCompanies', label: 'Voir toutes les entreprises', group: '🏢 Entreprises', desc: 'Accès à la liste complète des entreprises' },
  { key: 'canManageCompanies', label: 'Gérer les entreprises', group: '🏢 Entreprises', desc: 'Peut créer, modifier et désactiver des entreprises' },
  { key: 'canManageConsultants', label: 'Créer des comptes consultant', group: '👥 Utilisateurs', desc: 'Peut créer et supprimer des comptes consultant' },
  { key: 'canManageAdmins', label: 'Créer des comptes admin', group: '👥 Utilisateurs', desc: 'Peut créer et supprimer des comptes admin (superadmin seulement)' },
  { key: 'canManagePins', label: 'Gérer les PINs entreprise', group: '🔑 Accès', desc: 'Peut régénérer les PINs d\'accès des entreprises' },
  { key: 'canViewLogs', label: 'Voir les journaux d\'activité', group: '🔑 Accès', desc: 'Accès à l\'historique complet des actions' },
  { key: 'canUnlockFolders', label: 'Déverrouiller des dossiers', group: '🔑 Accès', desc: 'Peut entrer le code PIN pour accéder aux dossiers confidentiels' },
]

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function SidebarNav({ active, role, permissions, onTabChange }: {
  active: string; role: string; permissions: Permissions | null; onTabChange: (t: string) => void
}) {
  const isSuperAdmin = role === 'superadmin'
  const isAdmin = role === 'admin' || isSuperAdmin

  const tabs = permissions?.visibleTabs ?? DEFAULT_PERMISSIONS[role as UserRole]?.visibleTabs ?? []

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="w-4 h-4" />, always: true },
    { id: 'companies', label: 'Entreprises', icon: <Building2 className="w-4 h-4" />, show: tabs.includes('companies') },
    { id: 'logs', label: 'Journaux', icon: <ScrollText className="w-4 h-4" />, show: tabs.includes('logs') },
    { id: 'pins', label: 'Gestion PINs', icon: <Key className="w-4 h-4" />, show: tabs.includes('pins') },
    { id: 'folders', label: 'Gestion Dossiers', icon: <FolderLock className="w-4 h-4" />, show: tabs.includes('folders') || isSuperAdmin },
    { id: 'admins', label: 'Utilisateurs', icon: <Users className="w-4 h-4" />, show: tabs.includes('admins') || isAdmin },
    { id: 'connexions', label: 'Connexions', icon: <UserCheck className="w-4 h-4" />, show: isSuperAdmin },
  ].filter(i => i.always || i.show)

  return (
    <aside className="w-64 flex-shrink-0 glass border-r border-white/5 min-h-screen flex flex-col">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
            <span className="text-gold-400 text-sm font-bold font-serif">SA</span>
          </div>
          <div>
            <div className="text-white font-medium text-sm font-serif">DEE</div>
            <div className={`text-xs px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${ROLE_COLORS[role] || 'text-stone-500'}`}>
              {role}
            </div>
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
        <a href="/" target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-stone-400 hover:text-gold-400 hover:bg-gold-500/10 transition-all mb-1">
          <span className="w-4 h-4">🌐</span>Retour au site
        </a>
        <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/' }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-stone-500 hover:text-red-400 hover:bg-red-950/20 transition-all">
          <LogOut className="w-4 h-4" />Déconnexion
        </button>
      </div>
    </aside>
  )
}

// ─── Modal changement de mot de passe (superadmin uniquement) ────────────────
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setSuccess(true); setSaving(false)
    setTimeout(onClose, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl border border-white/10 w-full max-w-md">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-white font-semibold font-serif flex items-center gap-2">
            <Lock className="w-4 h-4 text-gold-400" />Changer mon mot de passe
          </h2>
          <button onClick={onClose} className="text-stone-500 hover:text-white transition-all text-lg">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {success ? (
            <div className="text-center py-4">
              <div className="text-emerald-400 text-2xl mb-2">✓</div>
              <p className="text-emerald-400 font-medium">Mot de passe mis à jour !</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <label className="text-xs text-stone-400 mb-1 block">Mot de passe actuel</label>
                <input type={showCurrent ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)}
                  className="w-full bg-gov-800 border border-stone-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-white outline-none focus:border-stone-500" />
                <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 bottom-2.5 text-stone-500">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <label className="text-xs text-stone-400 mb-1 block">Nouveau mot de passe</label>
                <input type={showNext ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)}
                  className="w-full bg-gov-800 border border-stone-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-white outline-none focus:border-stone-500" />
                <button onClick={() => setShowNext(!showNext)} className="absolute right-3 bottom-2.5 text-stone-500">
                  {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div>
                <label className="text-xs text-stone-400 mb-1 block">Confirmer le nouveau mot de passe</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="w-full bg-gov-800 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-stone-500" />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving}
                  className="flex-1 btn-gold py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Mettre à jour'}
                </button>
                <button onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-xl text-sm text-stone-400 border border-stone-700 hover:border-stone-600 transition-all">
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tableau de permissions ────────────────────────────────────────────────────
function PermissionsEditor({
  userId, username, role, current, myRole, onSaved, onCancel
}: {
  userId: string; username: string; role: string; current: Permissions
  myRole: string; onSaved: (p: Permissions) => void; onCancel: () => void
}) {
  const [perms, setPerms] = useState<Permissions>({ ...current })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const groups = [...new Set(PERM_LABELS.map(p => p.group))]

  async function save() {
    setSaving(true); setError('')
    const res = await fetch('/api/admin/admins', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, permissions: perms }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    onSaved(perms)
    setSaving(false)
  }

  const canEdit = myRole === 'superadmin' || (myRole === 'admin' && role === 'consultant')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold font-serif">Permissions — {username}</h2>
            <div className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${ROLE_COLORS[role] || 'text-stone-500'}`}>{role}</div>
          </div>
          {!canEdit && <div className="flex items-center gap-1 text-xs text-stone-500"><Lock className="w-3 h-3" />Lecture seule</div>}
        </div>
        <div className="p-6 space-y-6">
          {groups.map(group => (
            <div key={group}>
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">{group}</h3>
              <div className="space-y-2">
                {PERM_LABELS.filter(p => p.group === group).map(({ key, label, desc }) => {
                  const val = perms[key] as boolean
                  return (
                    <button
                      key={key}
                      onClick={() => canEdit && setPerms(p => ({ ...p, [key]: !val }))}
                      className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl text-sm transition-all border text-left ${
                        val
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-stone-700 bg-gov-800 text-stone-500'
                      } ${canEdit ? 'hover:border-stone-500 cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                    >
                      <span className="mt-0.5 flex-shrink-0">
                        {val ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </span>
                      <div>
                        <div className="font-medium">{label}</div>
                        <div className="text-xs opacity-60 mt-0.5">{desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Onglets visibles */}
          <div>
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">🖥️ Onglets visibles</h3>
            <p className="text-xs text-stone-600 mb-3">Quels onglets du dashboard cet utilisateur peut voir</p>
            <div className="grid grid-cols-2 gap-2">
              {(['dashboard', 'companies', 'logs', 'pins', 'admins'] as const).map(tab => {
                const active = perms.visibleTabs.includes(tab)
                return (
                  <button key={tab}
                    onClick={() => {
                      if (!canEdit) return
                      setPerms(p => ({
                        ...p,
                        visibleTabs: active
                          ? p.visibleTabs.filter(t => t !== tab)
                          : [...p.visibleTabs, tab]
                      }))
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                      active
                        ? 'border-gold-500/30 bg-gold-500/10 text-gold-400'
                        : 'border-stone-700 bg-gov-800 text-stone-500'
                    } ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}>
                    {active ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                    {tab}
                  </button>
                )
              })}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            {canEdit && (
              <button onClick={save} disabled={saving}
                className="flex-1 btn-gold py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sauvegarder'}
              </button>
            )}
            <button onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-xl text-sm text-stone-400 border border-stone-700 hover:border-stone-600 transition-all">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── User Manager (admins + consultants) ──────────────────────────────────────
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== userId))
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-400 w-6 h-6" /></div>

  const groups = {
    superadmin: users.filter(u => u.role === 'superadmin'),
    admin: users.filter(u => u.role === 'admin'),
    consultant: users.filter(u => u.role === 'consultant')
  }

  // Un admin ne voit pas la section superadmin
  const visibleGroups = [
    ...(isSuperAdmin ? [{ label: 'Superadmin', key: 'superadmin', items: groups.superadmin }] : []),
    { label: 'Admins', key: 'admin', items: groups.admin },
    { label: 'Consultants', key: 'consultant', items: groups.consultant },
  ]

  return (
    <div className="space-y-6">
      {editingUser && (
        <PermissionsEditor
          userId={editingUser.id}
          username={editingUser.username}
          role={editingUser.role}
          current={editingUser.permissions ?? DEFAULT_PERMISSIONS[editingUser.role as UserRole]}
          myRole={myRole}
          onSaved={(p) => {
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, permissions: p } : u))
            setEditingUser(null)
          }}
          onCancel={() => setEditingUser(null)}
        />
      )}

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}

      {/* Bloc superadmin privé — visible seulement par lui-même */}
      {isSuperAdmin && (
        <div className="glass rounded-xl p-5 border border-gold-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gold-400 text-lg">👑</span>
              <div>
                <div className="text-white font-semibold text-sm">Mon compte Superadmin</div>
                <div className="text-xs text-stone-500">Zone privée — visible uniquement par vous</div>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS['superadmin']}`}>superadmin</span>
          </div>
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 text-sm hover:bg-gold-500/20 transition-all">
            <Lock className="w-4 h-4" />Changer mon mot de passe
          </button>
        </div>
      )}

      <div className="glass rounded-xl p-4 border border-gold-600/10 text-sm text-stone-400">
        🏛️ <strong className="text-white">Hiérarchie :</strong> Superadmin → Admin → Consultant. Chaque niveau ne peut gérer que les niveaux inférieurs.
      </div>

      {(canCreateAdmin || canCreateConsultant) && (
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
            {canCreateConsultant && (
              <button onClick={() => setNewRole('consultant')}
                className={`px-4 py-2 rounded-lg text-sm border transition-all ${newRole === 'consultant' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-stone-700 text-stone-400'}`}>
                Consultant
              </button>
            )}
            {canCreateAdmin && (
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
              className="px-6 py-2 rounded-xl text-sm text-stone-400 border border-stone-700 hover:border-stone-600 transition-all">
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste par rôle */}
      {visibleGroups.map(({ label, key, items }) => items.length > 0 && (
        <div key={key}>
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">{label}</h3>
          <div className="space-y-2">
            {items.map(user => {
              const isMe = user.id === myUserId
              const canEditUser = !isMe && (
                isSuperAdmin
                  ? user.role !== 'superadmin'
                  : myRole === 'admin' && user.role === 'consultant'
              )
              return (
                <div key={user.id} className={`glass rounded-xl p-4 border flex items-center gap-4 ${isMe && isSuperAdmin ? 'border-gold-500/20' : 'border-white/5'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${ROLE_COLORS[user.role] || ''}`}>
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium text-sm">{user.username}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role] || ''}`}>{user.role}</span>
                      {isMe && <span className="text-xs text-stone-500 italic">— vous</span>}
                    </div>
                    <div className="text-xs text-stone-600 mt-0.5">
                      Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      {user.lastLogin && ` · Dernière connexion: ${new Date(user.lastLogin).toLocaleDateString('fr-FR')}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEditUser && (
                      <button onClick={() => setEditingUser(user)}
                        className="p-2 rounded-lg text-stone-500 hover:text-gold-400 hover:bg-gold-500/10 transition-all"
                        title="Gérer les permissions">
                        <Settings className="w-4 h-4" />
                      </button>
                    )}
                    {canEditUser && (
                      <button onClick={() => deleteUser(user.id, user.username)}
                        className="p-2 rounded-lg text-stone-600 hover:text-red-400 hover:bg-red-950/20 transition-all">
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
        🔑 Régénère un PIN aléatoire ou saisis un PIN personnalisé à 4 chiffres.
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
                <div className="text-xs text-stone-600 capitalize">{CATEGORY_LABELS[company.category] || company.category}</div>
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
// ─── Catégories de logs ──────────────────────────────────────────────────────
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-400 w-6 h-6" /></div>

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par utilisateur, fichier, dossier, entreprise..."
          className="w-full pl-10 pr-4 py-2.5 bg-gov-800 border border-stone-700 rounded-xl text-sm text-white outline-none focus:border-stone-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filtres catégories */}
      <div className="flex flex-wrap gap-2">
        {LOG_CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
              category === cat.id
                ? 'border-gold-500/40 bg-gold-500/10 text-gold-400'
                : 'border-stone-700 text-stone-500 hover:border-stone-600 hover:text-stone-300'
            }`}>
            <span>{cat.icon}</span>{cat.label}
            <span className="opacity-50 ml-0.5">
              {cat.id === 'all' ? logs.length : logs.filter(l => ACTION_LABELS[l.action]?.category === cat.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-1.5">
        {filtered.map(log => {
          const meta = ACTION_LABELS[log.action] || { label: log.action, color: 'text-stone-400', icon: '📋', category: 'other' }
          const isConsultation = meta.category === 'consultation'
          return (
            <div key={log.id} className={`flex items-start gap-3 glass rounded-xl px-4 py-3 border transition-all ${
              isConsultation ? 'border-sky-500/10 bg-sky-950/5' : 'border-white/5'
            }`}>
              <span className="text-base flex-shrink-0 mt-0.5">{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                  <span className="text-xs text-stone-400 font-medium">{log.userLabel}</span>
                  {log.companyName && <span className="text-xs text-stone-500 bg-gov-700 px-2 py-0.5 rounded-full">{log.companyName}</span>}
                  {log.fileName && <span className="text-xs text-stone-400 bg-gov-700 px-2 py-0.5 rounded-full truncate max-w-40">📄 {log.fileName}</span>}
                </div>
                {log.details && <div className="text-xs text-stone-600 mt-0.5">{log.details}</div>}
                {isConsultation && (
                  <div className="text-xs text-sky-700 mt-0.5">
                    {new Date(log.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {' à '}
                    {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
              <div className="text-xs text-stone-600 flex-shrink-0 text-right">
                <div>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: fr })}</div>
                {!isConsultation && (
                  <div className="text-stone-700 mt-0.5">
                    {new Date(log.timestamp).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-stone-600 text-sm">
            {search ? `Aucun résultat pour "${search}"` : 'Aucun journal dans cette catégorie'}
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
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-400 w-6 h-6" /></div>
  const loginLogs = logs.filter(l => l.action === 'LOGIN_SUCCESS' || l.action === 'LOGIN_FAILED')
  return (
    <div className="space-y-6">
      <div className="glass rounded-xl px-4 py-3 border border-stone-700/40 text-xs text-stone-500 flex items-center gap-2">
        <Lock className="w-3 h-3 text-stone-600" />
        Les adresses IP sont hachées de façon irréversible — elles ne sont jamais stockées en clair.
      </div>
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
        {loginLogs.slice(0, 100).map(log => (
          <div key={log.id} className="flex items-center gap-4 glass rounded-xl px-4 py-3 border border-white/5">
            <span className="text-lg">{log.action === 'LOGIN_SUCCESS' ? '🔓' : '🚫'}</span>
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${log.action === 'LOGIN_SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>{log.userLabel}</span>
              {log.ip && (
                <span className="text-xs text-stone-700 ml-2 font-mono bg-gov-800 px-1.5 py-0.5 rounded" title="IP hachée (SHA-256 — non réversible)">
                  #{log.ip}
                </span>
              )}
            </div>
            <div className="text-xs text-stone-600 text-right flex-shrink-0">
              <div>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: fr })}</div>
              <div className="text-stone-700">{new Date(log.timestamp).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


// ─── Gestion Dossiers (registre des verrous) ──────────────────────────────────
function FolderManager() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [folders, setFolders] = useState<Record<string, { name: string; locked: boolean; companyName: string }[]>>({})
  const [loading, setLoading] = useState(true)
  const [lockingFolder, setLockingFolder] = useState<{ id: string; name: string; companyId: string } | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [unlockTarget, setUnlockTarget] = useState<{ id: string; name: string; companyId: string } | null>(null)
  const [unlockPin, setUnlockPin] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/companies/list').then(r => r.json()).then(async (comps: Company[]) => {
      setCompanies(comps)
      const all: Record<string, { name: string; locked: boolean; companyName: string }[]> = {}
      await Promise.all(comps.map(async (c) => {
        const res = await fetch(`/api/files/folders?companyId=${c.id}`)
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          all[c.id] = data.map((f: { name: string; lockPin?: string; id: string }) => ({
            id: f.id, name: f.name, locked: !!f.lockPin, companyName: c.name, companyId: c.id,
          }))
        }
      }))
      setFolders(all)
    }).finally(() => setLoading(false))
  }, [])

  async function lockFolder() {
    if (!lockingFolder) return
    if (!pinInput || pinInput !== pinConfirm) { setError('Les codes ne correspondent pas'); return }
    if (!/^\d{4}$/.test(pinInput)) { setError('Le code doit être 4 chiffres'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/files/folders/lock', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: lockingFolder.id, pin: pinInput }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setFolders(prev => {
      const updated = { ...prev }
      if (updated[lockingFolder.companyId]) {
        updated[lockingFolder.companyId] = updated[lockingFolder.companyId].map((f: { id: string; locked: boolean }) =>
          f.id === lockingFolder.id ? { ...f, locked: true } : f
        )
      }
      return updated
    })
    setLockingFolder(null); setPinInput(''); setPinConfirm(''); setSaving(false)
  }

  async function unlockFolder() {
    if (!unlockTarget || !unlockPin) return
    setSaving(true); setError('')
    const res = await fetch('/api/files/folders/lock', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId: unlockTarget.id, pin: unlockPin, unlock: true }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setFolders(prev => {
      const updated = { ...prev }
      if (updated[unlockTarget.companyId]) {
        updated[unlockTarget.companyId] = updated[unlockTarget.companyId].map((f: { id: string; locked: boolean }) =>
          f.id === unlockTarget.id ? { ...f, locked: false } : f
        )
      }
      return updated
    })
    setUnlockTarget(null); setUnlockPin(''); setSaving(false)
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gold-400 w-6 h-6" /></div>

  const allFolders = Object.values(folders).flat() as { id: string; name: string; locked: boolean; companyName: string; companyId: string }[]

  return (
    <div className="space-y-6">
      {/* Modal verrouillage */}
      {lockingFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass rounded-2xl border border-white/10 w-full max-w-sm p-6 space-y-4">
            <h2 className="text-white font-semibold font-serif flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-amber-400" />Verrouiller "{lockingFolder.name}"
            </h2>
            <p className="text-xs text-stone-500">Ce dossier ne sera accessible qu'avec le code à 4 chiffres.</p>
            <div>
              <label className="text-xs text-stone-400 mb-1 block">Code PIN (4 chiffres)</label>
              <input type="password" inputMode="numeric" maxLength={4} value={pinInput}
                onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setPinInput(e.target.value) }}
                className="w-full bg-gov-800 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 font-mono tracking-widest"
                placeholder="••••" />
            </div>
            <div>
              <label className="text-xs text-stone-400 mb-1 block">Confirmer le code</label>
              <input type="password" inputMode="numeric" maxLength={4} value={pinConfirm}
                onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setPinConfirm(e.target.value) }}
                className="w-full bg-gov-800 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500 font-mono tracking-widest"
                placeholder="••••" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button onClick={lockFolder} disabled={saving || pinInput.length !== 4}
                className="flex-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '🔒 Verrouiller'}
              </button>
              <button onClick={() => { setLockingFolder(null); setPinInput(''); setPinConfirm(''); setError('') }}
                className="flex-1 py-2 rounded-xl text-sm text-stone-400 border border-stone-700 hover:border-stone-600 transition-all">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal déverrouillage */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass rounded-2xl border border-white/10 w-full max-w-sm p-6 space-y-4">
            <h2 className="text-white font-semibold font-serif flex items-center gap-2">
              <Unlock className="w-4 h-4 text-green-400" />Déverrouiller "{unlockTarget.name}"
            </h2>
            <div>
              <label className="text-xs text-stone-400 mb-1 block">Code PIN actuel</label>
              <input type="password" inputMode="numeric" maxLength={4} value={unlockPin}
                onChange={e => { if (/^\d{0,4}$/.test(e.target.value)) setUnlockPin(e.target.value) }}
                className="w-full bg-gov-800 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-green-500 font-mono tracking-widest"
                placeholder="••••" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button onClick={unlockFolder} disabled={saving || unlockPin.length !== 4}
                className="flex-1 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '🔓 Déverrouiller'}
              </button>
              <button onClick={() => { setUnlockTarget(null); setUnlockPin(''); setError('') }}
                className="flex-1 py-2 rounded-xl text-sm text-stone-400 border border-stone-700 hover:border-stone-600 transition-all">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-xl p-4 border border-amber-600/10 text-sm text-stone-400">
        🔒 <strong className="text-white">Registre des dossiers confidentiels.</strong> Seuls les admins peuvent verrouiller/déverrouiller. Les codes sont hachés — ils ne sont jamais affichés.
      </div>

      {allFolders.length === 0 ? (
        <div className="text-center py-20 text-stone-600">
          <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun dossier custom créé pour l'instant</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(folders).map(([companyId, cFolders]) => (
            <div key={companyId}>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                {(cFolders[0] as { companyName?: string })?.companyName ?? companyId}
              </h3>
              <div className="space-y-1.5">
                {(cFolders as { id: string; name: string; locked: boolean; companyName: string; companyId: string }[]).map(f => (
                  <div key={f.id} className={`flex items-center gap-4 glass rounded-xl px-4 py-3 border ${f.locked ? 'border-amber-500/20 bg-amber-950/5' : 'border-white/5'}`}>
                    <span className="text-lg">{f.locked ? '🔒' : '📁'}</span>
                    <div className="flex-1">
                      <span className="text-sm text-white font-medium">{f.name}</span>
                      {f.locked && <span className="ml-2 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Confidentiel</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {f.locked ? (
                        <button onClick={() => { setUnlockTarget({ id: f.id, name: f.name, companyId: f.companyId }); setError('') }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all">
                          <Unlock className="w-3 h-3" />Déverrouiller
                        </button>
                      ) : (
                        <button onClick={() => { setLockingFolder({ id: f.id, name: f.name, companyId: f.companyId }); setError('') }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all">
                          <FolderLock className="w-3 h-3" />Verrouiller
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
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
  const [userId, setUserId] = useState('')
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [checking, setChecking] = useState(true)

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

  if (checking) return <div className="min-h-screen bg-gov-900 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold-400" /></div>

  const TAB_TITLES: Record<string, string> = {
    dashboard: 'Tableau de bord',
    companies: 'Entreprises',
    logs: "Journaux d'activité",
    pins: 'Gestion des PINs',
    folders: 'Gestion Dossiers',
    admins: 'Utilisateurs',
    connexions: 'Connexions',
  }

  return (
    <div className="min-h-screen bg-gov-900 flex">
      <SidebarNav active={tab} role={role} permissions={permissions} onTabChange={setTab} />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="glass border-b border-white/5 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-serif text-lg font-bold text-white">{TAB_TITLES[tab] || tab}</h1>
            <p className="text-xs text-stone-600">DEE — État de San Andreas</p>
          </div>
          <a href="/" target="_blank" rel="noopener noreferrer" className="text-xs text-stone-600 hover:text-stone-400 transition-colors">Voir le site public ↗</a>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          {tab === 'dashboard' && <DashboardHome stats={stats} />}
          {tab === 'companies' && <CompaniesList />}
          {tab === 'logs' && <LogsView />}
          {tab === 'pins' && <PinManager />}
          {tab === 'folders' && <FolderManager />}
          {tab === 'admins' && <UserManager myRole={role} myUserId={userId} />}
          {tab === 'connexions' && role === 'superadmin' && <ConnexionsAdmins />}
        </main>
      </div>
    </div>
  )
}

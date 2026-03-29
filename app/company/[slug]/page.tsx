'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Lock, Unlock, Upload, FileText,
  Trash2, Pin, PinOff, Search, Folder, FolderPlus,
  Download, ExternalLink, AlertCircle, Loader2, X,
  Pencil, Check, ChevronRight, FolderOpen,
} from 'lucide-react'
import { FileRecord, CustomFolder, DEFAULT_FOLDERS, Permissions, DEFAULT_PERMISSIONS, CompanyCategory } from '@/types'

// ─── Dossiers par défaut (icônes) ─────────────────────────────────────────────
const DEFAULT_FOLDER_ICONS: Record<string, string> = {
  Financier: '💰', RH: '👥', Contrats: '📋', Logistique: '🚚', 'Stratégie': '🎯',
}
function folderIcon(name: string) {
  return DEFAULT_FOLDER_ICONS[name] ?? '📁'
}

function formatSize(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf')
    return <span className="text-red-400 font-bold text-xs bg-red-400/10 px-1.5 py-0.5 rounded">PDF</span>
  if (mimeType.includes('word'))
    return <span className="text-blue-400 font-bold text-xs bg-blue-400/10 px-1.5 py-0.5 rounded">DOC</span>
  if (mimeType.includes('sheet') || mimeType.includes('excel'))
    return <span className="text-green-400 font-bold text-xs bg-green-400/10 px-1.5 py-0.5 rounded">XLS</span>
  if (mimeType.startsWith('image/'))
    return <span className="text-purple-400 font-bold text-xs bg-purple-400/10 px-1.5 py-0.5 rounded">IMG</span>
  return <FileText className="w-4 h-4 text-stone-400" />
}
function getProxyUrl(blobUrl: string, mode: 'download' | 'inline') {
  return `/api/files/download?url=${encodeURIComponent(blobUrl)}&mode=${mode}`
}

// ─── PIN Entry ────────────────────────────────────────────────────────────────
function PinEntry({ companyName, slug, accentColor, onSuccess }: {
  companyName: string; slug: string; accentColor: string; onSuccess: () => void
}) {
  const [pins, setPins] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [blocked, setBlocked] = useState(0)
  const r0 = useRef<HTMLInputElement>(null)
  const r1 = useRef<HTMLInputElement>(null)
  const r2 = useRef<HTMLInputElement>(null)
  const r3 = useRef<HTMLInputElement>(null)
  const refs = [r0, r1, r2, r3]

  useEffect(() => {
    if (blocked > 0) {
      const t = setInterval(() => setBlocked(b => b <= 1 ? (clearInterval(t), 0) : b - 1), 1000)
      return () => clearInterval(t)
    }
  }, [blocked])

  async function submitPin(pin: string) {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/company', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, pin }),
      })
      const data = await res.json()
      if (!res.ok) { if (res.status === 429) setBlocked(30); throw new Error(data.error || 'PIN incorrect') }
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setPins(['', '', '', ''])
      setTimeout(() => refs[0].current?.focus(), 50)
    } finally { setLoading(false) }
  }

  function handleChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...pins]; next[i] = val; setPins(next)
    if (val && i < 3) refs[i + 1].current?.focus()
    if (next.every(p => p)) submitPin(next.join(''))
  }
  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !pins[i] && i > 0) refs[i - 1].current?.focus()
  }

  return (
    <div className="min-h-screen bg-gov-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
          style={{ backgroundColor: accentColor }} />
      </div>
      <div className="relative w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-300 text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <div className="glass rounded-2xl p-8 border border-gold-600/10 shadow-2xl shadow-black/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 border"
              style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }}>
              <Lock className="w-7 h-7" style={{ color: accentColor }} />
            </div>
            <h1 className="font-serif text-xl font-bold text-white mb-1">{companyName}</h1>
            <p className="text-stone-500 text-sm">Entrez votre code PIN à 4 chiffres</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/40 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{error}</span>
            </div>
          )}
          {blocked > 0 && (
            <div className="text-center text-amber-400 text-sm mb-6">
              Réessayez dans <span className="font-mono font-bold">{blocked}s</span>
            </div>
          )}
          <div className="flex gap-3 justify-center mb-8">
            {pins.map((p, i) => (
              <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1} value={p}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={loading || blocked > 0}
                className="pin-digit disabled:opacity-40"
                style={{ borderColor: p ? accentColor : undefined }}
                autoFocus={i === 0} />
            ))}
          </div>
          {loading && (
            <div className="flex items-center justify-center gap-2 text-stone-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />Vérification...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── File Row ─────────────────────────────────────────────────────────────────
function FileRow({ file, canDelete, canPin, onDelete, onPin }: {
  file: FileRecord; canDelete: boolean; canPin: boolean
  onDelete: (id: string) => void; onPin: (id: string, pinned: boolean) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [pinning, setPinning] = useState(false)

  async function handleDelete() {
    if (!confirm(`Supprimer "${file.name}" ?`)) return
    setDeleting(true)
    const res = await fetch('/api/files/delete', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: file.id }),
    })
    if (res.ok) onDelete(file.id)
    setDeleting(false)
  }
  async function handlePin() {
    setPinning(true)
    await fetch('/api/files/pin', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: file.id, pinned: !file.pinned }),
    })
    onPin(file.id, !file.pinned)
    setPinning(false)
  }

  const openUrl = getProxyUrl(file.blobUrl, 'inline')
  const downloadUrl = getProxyUrl(file.blobUrl, 'download')

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group ${
      file.pinned ? 'bg-gold-900/10 border-gold-600/20' : 'bg-gov-800/50 border-stone-800/50 hover:border-stone-700'
    }`}>
      <div className="w-10 h-10 rounded-lg bg-gov-700 flex items-center justify-center flex-shrink-0">
        <FileTypeIcon mimeType={file.mimeType} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {file.pinned && <Pin className="w-3 h-3 text-gold-400 flex-shrink-0" />}
          <span className="text-sm text-white font-medium truncate">{file.name}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
          <span>{formatSize(file.size)}</span>
          <span>·</span>
          <span>{formatDate(file.uploadedAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Folder className="w-3 h-3" />{file.folder}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a href={openUrl} target="_blank" rel="noopener noreferrer"
          className="p-2 rounded-lg text-stone-500 hover:text-gold-400 hover:bg-gov-700 transition-all" title="Ouvrir">
          <ExternalLink className="w-4 h-4" />
        </a>
        <a href={downloadUrl} download={file.name}
          className="p-2 rounded-lg text-stone-500 hover:text-blue-400 hover:bg-gov-700 transition-all" title="Télécharger">
          <Download className="w-4 h-4" />
        </a>
        {canPin && (
          <button onClick={handlePin} disabled={pinning}
            className="p-2 rounded-lg text-stone-500 hover:text-gold-400 hover:bg-gov-700 transition-all disabled:opacity-40"
            title={file.pinned ? 'Désépingler' : 'Épingler'}>
            {pinning ? <Loader2 className="w-4 h-4 animate-spin" /> : file.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
        )}
        {canDelete && (
          <button onClick={handleDelete} disabled={deleting}
            className="p-2 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-950/30 transition-all disabled:opacity-40" title="Supprimer">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({ companyId, companySlug, folder, onUploaded }: {
  companyId: string; companySlug: string; folder: string; onUploaded: (f: FileRecord) => void
}) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [uploadError, setUploadError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    setUploading(true); setProgress(`Envoi de ${file.name}...`); setUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', folder)
      fd.append('companyId', companyId)
      fd.append('companySlug', companySlug)
      const res = await fetch('/api/files/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUploaded(data.file)
      setProgress('')
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Erreur upload')
      setProgress('')
    } finally { setUploading(false) }
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) uploadFile(f) }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragging ? 'border-gold-500 bg-gold-900/10' : 'border-stone-700 hover:border-stone-600 hover:bg-gov-800/30'
        }`}
      >
        <input ref={inputRef} type="file" className="hidden" accept=".pdf,.docx,.xlsx,.png,.jpeg,.jpg"
          onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-7 h-7 text-gold-400 animate-spin" />
            <span className="text-stone-400 text-sm">{progress}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-7 h-7 text-stone-600" />
            <p className="text-stone-400 text-sm font-medium">Glissez ou cliquez</p>
            <p className="text-stone-600 text-xs">PDF, DOCX, XLSX, PNG, JPEG — 10MB max</p>
          </div>
        )}
      </div>
      {uploadError && (
        <div className="mt-2 flex items-center gap-2 text-red-400 text-xs bg-red-950/30 rounded-lg px-3 py-2">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />{uploadError}
        </div>
      )}
    </div>
  )
}

// ─── Sidebar Dossiers ─────────────────────────────────────────────────────────
function FolderSidebar({
  companyId, files, activeFolder, accentColor, isStaff,
  customFolders, onFolderChange, onFoldersUpdate,
}: {
  companyId: string
  files: FileRecord[]
  activeFolder: string
  accentColor: string
  isStaff: boolean
  customFolders: CustomFolder[]
  onFolderChange: (name: string) => void
  onFoldersUpdate: (folders: CustomFolder[]) => void
}) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [hovered, setHovered] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const renameRef = useRef<HTMLInputElement>(null)

  // Tous les dossiers : défauts + custom (sans sous-dossiers pour l'instant)
  const defaultItems = DEFAULT_FOLDERS.map(name => ({ id: `default-${name}`, name, isDefault: true, locked: false }))
  const customItems = customFolders.filter(f => !f.parentId).map(f => ({ ...f, isDefault: false, locked: !!f.lockPin }))
  const allFolders = [...defaultItems, ...customItems]

  useEffect(() => { if (creating) setTimeout(() => inputRef.current?.focus(), 50) }, [creating])
  useEffect(() => { if (renamingId) setTimeout(() => renameRef.current?.focus(), 50) }, [renamingId])

  async function createFolder() {
    if (!newName.trim()) return
    setSaving(true); setCreateError('')
    const res = await fetch('/api/files/folders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), companyId }),
    })
    const data = await res.json()
    if (!res.ok) { setCreateError(data.error); setSaving(false); return }
    onFoldersUpdate([...customFolders, data.folder])
    setNewName(''); setCreating(false); setSaving(false)
    onFolderChange(data.folder.name)
  }

  async function renameFolder(folderId: string, oldName: string) {
    if (!renameValue.trim() || renameValue.trim() === oldName) { setRenamingId(null); return }
    const res = await fetch('/api/files/folders', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId, name: renameValue.trim() }),
    })
    if (res.ok) {
      onFoldersUpdate(customFolders.map(f => f.id === folderId ? { ...f, name: renameValue.trim() } : f))
      if (activeFolder === oldName) onFolderChange(renameValue.trim())
    }
    setRenamingId(null)
  }

  async function deleteFolder(folderId: string, name: string) {
    if (!confirm(`Supprimer "${name}" ?\nLes fichiers seront déplacés vers "Général".`)) return
    const res = await fetch('/api/files/folders', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderId }),
    })
    if (res.ok) {
      onFoldersUpdate(customFolders.filter(f => f.id !== folderId))
      if (activeFolder === name) onFolderChange('all')
    }
  }

  return (
    <div className="glass rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Dossiers</h3>
        {isStaff && (
          <button
            onClick={() => { setCreating(true); setCreateError('') }}
            className="p-1 rounded-lg text-stone-600 hover:text-gold-400 hover:bg-gold-500/10 transition-all"
            title="Nouveau dossier"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-0.5">
        {/* Tous les fichiers */}
        <button
          onClick={() => onFolderChange('all')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all"
          style={activeFolder === 'all'
            ? { backgroundColor: `${accentColor}20`, color: accentColor }
            : { color: '#78716c' }}
        >
          <FolderOpen className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Tous les fichiers</span>
          <span className="text-xs opacity-60">{files.length}</span>
        </button>

        {/* Dossiers */}
        {allFolders.map(({ id, name, isDefault }) => {
          const count = files.filter(f => f.folder === name).length
          const isActive = activeFolder === name
          const isRenaming = renamingId === id

          return (
            <div key={id} className="relative"
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}>
              {isRenaming ? (
                <div className="flex items-center gap-1 px-2 py-1">
                  <span className="text-sm">{folderIcon(name)}</span>
                  <input
                    ref={renameRef}
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') renameFolder(id, name)
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    className="flex-1 bg-gov-700 border border-stone-600 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-stone-400 min-w-0"
                  />
                  <button onClick={() => renameFolder(id, name)} className="text-emerald-400 hover:text-emerald-300 p-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setRenamingId(null)} className="text-stone-500 hover:text-stone-300 p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onFolderChange(name)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all"
                  style={isActive
                    ? { backgroundColor: `${accentColor}20`, color: accentColor }
                    : { color: '#78716c' }}
                >
                  <span className="text-base flex-shrink-0">{folderIcon(name)}</span>
                  <span className="flex-1 text-left truncate">{name}</span>
                  <span className="text-xs opacity-60">{count}</span>
                  {(allFolders.find(af => af.id === id) as { locked?: boolean })?.locked && <span title="Dossier confidentiel">🔒</span>}

                  {/* Actions renommer / supprimer — seulement custom, au hover */}
                  {isStaff && !isDefault && hovered === id && (
                    <span className="flex items-center gap-0.5 ml-1" onClick={e => e.stopPropagation()}>
                      <span
                        role="button"
                        onClick={() => { setRenamingId(id); setRenameValue(name) }}
                        className="p-1 rounded text-stone-500 hover:text-gold-400 hover:bg-gold-500/10 cursor-pointer transition-all"
                        title="Renommer">
                        <Pencil className="w-3 h-3" />
                      </span>
                      <span
                        role="button"
                        onClick={() => deleteFolder(id, name)}
                        className="p-1 rounded text-stone-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-all"
                        title="Supprimer">
                        <Trash2 className="w-3 h-3" />
                      </span>
                    </span>
                  )}
                </button>
              )}
            </div>
          )
        })}

        {/* Formulaire nouveau dossier */}
        {creating && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 mt-1 border border-stone-700 rounded-xl bg-gov-800/50">
            <span className="text-sm">📁</span>
            <input
              ref={inputRef}
              value={newName}
              onChange={e => { setNewName(e.target.value); setCreateError('') }}
              onKeyDown={e => {
                if (e.key === 'Enter') createFolder()
                if (e.key === 'Escape') { setCreating(false); setNewName('') }
              }}
              placeholder="Nom du dossier"
              maxLength={50}
              className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-stone-600 min-w-0"
            />
            <button onClick={createFolder} disabled={saving || !newName.trim()}
              className="text-emerald-400 hover:text-emerald-300 p-0.5 disabled:opacity-40">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => { setCreating(false); setNewName(''); setCreateError('') }}
              className="text-stone-500 hover:text-stone-300 p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {createError && <p className="text-red-400 text-xs px-2 pt-1">{createError}</p>}
      </div>
    </div>
  )
}

// ─── Company Page ─────────────────────────────────────────────────────────────
export default function CompanyPage() {
  const { slug } = useParams() as { slug: string }

  // ── State ─────────────────────────────────────────────────────────────────
  const [company, setCompany] = useState<{ id: string; name: string; slug: string; category: CompanyCategory; color: string; accentColor: string; description?: string } | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [isStaff, setIsStaff] = useState(false)
  const [permissions, setPermissions] = useState<Permissions | null>(null)
  const [files, setFiles] = useState<FileRecord[]>([])
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>([])
  const [unlockedFolders, setUnlockedFolders] = useState<Set<string>>(new Set())
  const [lockModal, setLockModal] = useState<{ folder: CustomFolder } | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeFolder, setActiveFolder] = useState('all')
  const [search, setSearch] = useState('')
  const [dbCompany, setDbCompany] = useState<{ id: string; name: string } | null>(null)

  // ── PIN modal state (hooks must be at top level) ───────────────────────────
  const [lockPinInput, setLockPinInput] = useState(['', '', '', ''])
  const [lockPinError, setLockPinError] = useState('')
  const [lockPinLoading, setLockPinLoading] = useState(false)
  const lockPinRef0 = useRef<HTMLInputElement>(null)
  const lockPinRef1 = useRef<HTMLInputElement>(null)
  const lockPinRef2 = useRef<HTMLInputElement>(null)
  const lockPinRef3 = useRef<HTMLInputElement>(null)
  const lockPinRefs = [lockPinRef0, lockPinRef1, lockPinRef2, lockPinRef3]

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.authenticated) return
      const role = d.role ?? d.session?.role
      const perms: Permissions = d.permissions ?? DEFAULT_PERMISSIONS[role] ?? DEFAULT_PERMISSIONS.consultant
      if (role === 'superadmin' || role === 'admin' || role === 'consultant') {
        setIsStaff(true); setAuthenticated(true); setPermissions(perms)
      } else if (role === 'company') {
        const cs = d.companySlug ?? d.session?.companySlug
        if (cs === slug) setAuthenticated(true)
      }
    }).catch(() => {})
  }, [slug])

  useEffect(() => {
    if (!authenticated) return
    setLoading(true)
    fetch('/api/companies/list')
      .then(r => r.json())
      .then(companies => {
        const c = companies.find((x: { slug: string; id: string; name: string; category: CompanyCategory; color: string; accentColor: string; description?: string }) => x.slug === slug)
        if (!c) return null
        setDbCompany({ id: c.id, name: c.name })
        setCompany({ id: c.id, name: c.name, slug: c.slug, category: c.category as CompanyCategory, color: c.color, accentColor: c.accentColor, description: c.description })
        return Promise.all([
          fetch(`/api/files/list?companyId=${c.id}`).then(r => r.json()),
          fetch(`/api/files/folders?companyId=${c.id}`).then(r => r.json()),
        ])
      })
      .then(results => {
        if (!results) return
        const [filesData, foldersData] = results
        if (filesData && !filesData.error) setFiles(filesData)
        if (Array.isArray(foldersData)) setCustomFolders(foldersData)
      })
      .finally(() => setLoading(false))
  }, [authenticated, slug])

  // ── Folder PIN unlock ─────────────────────────────────────────────────────
  async function submitFolderPin(pin: string, folder: CustomFolder) {
    setLockPinLoading(true); setLockPinError('')
    const res = await fetch(`/api/files/folders/lock?folderId=${folder.id}&pin=${pin}`)
    const data = await res.json()
    if (!res.ok) {
      setLockPinError(data.error || 'Code incorrect')
      setLockPinInput(['', '', '', ''])
      setTimeout(() => lockPinRefs[0].current?.focus(), 50)
      setLockPinLoading(false)
      return
    }
    setUnlockedFolders(prev => new Set([...prev, folder.id]))
    setActiveFolder(folder.name)
    setLockModal(null)
    setLockPinInput(['', '', '', ''])
    setLockPinLoading(false)
  }

  // ── Early returns (after all hooks) ──────────────────────────────────────
  if (!company) return (
    <div className="min-h-screen bg-gov-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-serif text-2xl text-white mb-2">Entreprise introuvable</h1>
        <Link href="/" className="text-gold-400 hover:underline text-sm">Retour à l'accueil</Link>
      </div>
    </div>
  )

  if (!authenticated) return (
    <PinEntry companyName={company.name} slug={slug} accentColor={company.accentColor} onSuccess={() => setAuthenticated(true)} />
  )

  // ── Computed ──────────────────────────────────────────────────────────────
  const canUpload = isStaff ? (permissions?.canUploadFiles ?? true) : true
  const canDelete = isStaff && (permissions?.canDeleteFiles ?? true)
  const canPin = permissions?.canPinFiles ?? isStaff
  const uploadFolder = activeFolder === 'all' ? DEFAULT_FOLDERS[0] : activeFolder

  const filtered = files.filter(f => {
    if (activeFolder !== 'all' && f.folder !== activeFolder) return false
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
    const cf = customFolders.find(cf => cf.name === f.folder)
    if (cf?.lockPin && !unlockedFolders.has(cf.id)) return false
    return true
  })
  const pinned = filtered.filter(f => f.pinned)
  const regular = filtered.filter(f => !f.pinned)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Modal déverrouillage dossier confidentiel */}
      {lockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass rounded-2xl border border-amber-500/20 w-full max-w-sm p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔒</div>
              <h2 className="text-white font-serif font-bold mb-1">Dossier confidentiel</h2>
              <p className="text-stone-500 text-sm">"{lockModal.folder.name}" est protégé par un code.</p>
            </div>
            {lockPinError && (
              <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/40 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">
                <span>{lockPinError}</span>
              </div>
            )}
            <div className="flex gap-3 justify-center mb-6">
              {lockPinInput.map((p, i) => (
                <input
                  key={i}
                  ref={lockPinRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={p}
                  onChange={e => {
                    if (!/^\d?$/.test(e.target.value)) return
                    const next = [...lockPinInput]; next[i] = e.target.value; setLockPinInput(next)
                    if (e.target.value && i < 3) lockPinRefs[i + 1].current?.focus()
                    if (next.every(v => v)) submitFolderPin(next.join(''), lockModal.folder)
                  }}
                  onKeyDown={e => { if (e.key === 'Backspace' && !p && i > 0) lockPinRefs[i - 1].current?.focus() }}
                  className="w-12 h-14 text-center text-xl font-mono bg-gov-800 border-2 border-stone-700 rounded-xl text-white outline-none focus:border-amber-500"
                  autoFocus={i === 0}
                />
              ))}
            </div>
            {lockPinLoading && (
              <div className="flex justify-center mb-4">
                <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
              </div>
            )}
            <button
              onClick={() => { setLockModal(null); setLockPinInput(['', '', '', '']); setLockPinError('') }}
              className="w-full py-2 rounded-xl text-sm text-stone-500 hover:text-stone-300 transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen" style={{ backgroundColor: company.color }}>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-8"
            style={{ backgroundColor: company.accentColor }} />
        </div>

        <header className="sticky top-0 z-50 glass border-b border-white/5">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isStaff ? (
                <Link href="/dashboard" className="flex items-center gap-1.5 text-stone-500 hover:text-gold-400 text-sm transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Dashboard
                </Link>
              ) : (
                <Link href="/" className="text-stone-500 hover:text-stone-300 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              )}
              <div className="w-px h-6 bg-stone-700" />
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: company.accentColor }} />
                <div>
                  <h1 className="font-serif text-white font-semibold">{company.name}</h1>
                  <p className="text-xs text-stone-500 capitalize">{company.category}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Unlock className="w-3 h-3" style={{ color: company.accentColor }} />
              {isStaff ? 'Accès staff' : 'Accès entreprise'}
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            <aside className="lg:col-span-1 space-y-4">
              <FolderSidebar
                companyId={dbCompany?.id ?? ''}
                files={files}
                activeFolder={activeFolder}
                accentColor={company.accentColor}
                isStaff={isStaff}
                customFolders={customFolders}
                onFolderChange={(name) => {
                  const folder = customFolders.find(f => f.name === name)
                  if (folder?.lockPin && !unlockedFolders.has(folder.id)) {
                    setLockModal({ folder })
                    return
                  }
                  setActiveFolder(name)
                }}
                onFoldersUpdate={setCustomFolders}
              />

              {canUpload && dbCompany && (
                <div className="glass rounded-2xl p-4 border border-white/5">
                  <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Déposer dans</h3>
                  <p className="text-xs text-stone-400 mb-3 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    <span className="font-medium" style={{ color: company.accentColor }}>{uploadFolder}</span>
                  </p>
                  <UploadZone
                    companyId={dbCompany.id}
                    companySlug={slug}
                    folder={uploadFolder}
                    onUploaded={f => setFiles(prev => [f, ...prev])}
                  />
                </div>
              )}
            </aside>

            <main className="lg:col-span-3 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="text"
                  placeholder={`Rechercher${activeFolder !== 'all' ? ` dans ${activeFolder}` : ''}...`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-gov-800/80 border border-stone-700/50 focus:border-stone-600 text-white text-sm outline-none transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: company.accentColor }} />
                </div>
              ) : (
                <>
                  {pinned.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-gold-400 uppercase tracking-wider flex items-center gap-2">
                        <Pin className="w-3 h-3" /> Épinglés
                      </h3>
                      {pinned.map(f => (
                        <FileRow key={f.id} file={f} canDelete={canDelete} canPin={canPin}
                          onDelete={id => setFiles(prev => prev.filter(x => x.id !== id))}
                          onPin={(id, p) => setFiles(prev => prev.map(x => x.id === id ? { ...x, pinned: p } : x))}
                        />
                      ))}
                    </div>
                  )}
                  {regular.length > 0 ? (
                    <div className="space-y-2">
                      {pinned.length > 0 && (
                        <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Fichiers</h3>
                      )}
                      {regular.map(f => (
                        <FileRow key={f.id} file={f} canDelete={canDelete} canPin={canPin}
                          onDelete={id => setFiles(prev => prev.filter(x => x.id !== id))}
                          onPin={(id, p) => setFiles(prev => prev.map(x => x.id === id ? { ...x, pinned: p } : x))}
                        />
                      ))}
                    </div>
                  ) : filtered.length === 0 && (
                    <div className="text-center py-20 text-stone-600">
                      <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">{search ? 'Aucun fichier trouvé' : 'Aucun fichier dans ce dossier'}</p>
                      {canUpload && <p className="text-xs mt-1 opacity-60">Déposez un fichier pour commencer</p>}
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}

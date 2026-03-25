'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Lock, Unlock, Upload, FileText, Image, Sheet, 
  Trash2, Pin, PinOff, Search, Folder, Download, ExternalLink,
  AlertCircle, Loader2, X, CheckCircle, ChevronDown
} from 'lucide-react'
import { COMPANIES } from '@/lib/companies-data'
import { FileRecord, FolderType } from '@/types'

const FOLDERS: FolderType[] = ['Financier', 'RH', 'Contrats', 'Logistique', 'Stratégie']

const FOLDER_ICONS: Record<FolderType, string> = {
  Financier: '💰',
  RH: '👥',
  Contrats: '📋',
  Logistique: '🚚',
  'Stratégie': '🎯',
}

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return <span className="text-red-400 font-bold text-xs">PDF</span>
  if (mimeType.includes('word')) return <span className="text-blue-400 font-bold text-xs">DOC</span>
  if (mimeType.includes('sheet')) return <span className="text-green-400 font-bold text-xs">XLS</span>
  if (mimeType.startsWith('image/')) return <span className="text-purple-400 font-bold text-xs">IMG</span>
  return <FileText className="w-4 h-4 text-stone-400" />
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── PIN Entry ────────────────────────────────────────────────────────────────
function PinEntry({ companyName, slug, accentColor, onSuccess }: {
  companyName: string
  slug: string
  accentColor: string
  onSuccess: () => void
}) {
  const [pins, setPins] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [blocked, setBlocked] = useState(0)
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  useEffect(() => {
    if (blocked > 0) {
      const t = setInterval(() => setBlocked(b => b <= 1 ? (clearInterval(t), 0) : b - 1), 1000)
      return () => clearInterval(t)
    }
  }, [blocked])

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...pins]
    next[i] = val
    setPins(next)
    if (val && i < 3) refs[i + 1].current?.focus()
    if (next.every(p => p)) submitPin(next.join(''))
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pins[i] && i > 0) refs[i - 1].current?.focus()
  }

  async function submitPin(pin: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, pin }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) setBlocked(data.retryAfter || 30)
        throw new Error(data.error || 'PIN incorrect')
      }
      onSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setPins(['', '', '', ''])
      refs[0].current?.focus()
    } finally {
      setLoading(false)
    }
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
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {blocked > 0 && (
            <div className="text-center text-amber-400 text-sm mb-6">
              Trop de tentatives. Réessayez dans <span className="font-mono font-bold">{blocked}s</span>
            </div>
          )}

          <div className="flex gap-3 justify-center mb-8">
            {pins.map((p, i) => (
              <input
                key={i}
                ref={refs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={p}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading || blocked > 0}
                className="pin-digit disabled:opacity-40"
                style={{ borderColor: p ? accentColor : undefined }}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-stone-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Vérification...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── File Row ─────────────────────────────────────────────────────────────────
function FileRow({ file, isAdmin, onDelete, onPin }: {
  file: FileRecord
  isAdmin: boolean
  onDelete: (id: string) => void
  onPin: (id: string, pinned: boolean) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [pinning, setPinning] = useState(false)

  async function handleDelete() {
    if (!confirm(`Supprimer "${file.name}" ?`)) return
    setDeleting(true)
    const res = await fetch('/api/files/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: file.id }),
    })
    if (res.ok) onDelete(file.id)
    setDeleting(false)
  }

  async function handlePin() {
    setPinning(true)
    await fetch('/api/files/pin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: file.id, pinned: !file.pinned }),
    })
    onPin(file.id, !file.pinned)
    setPinning(false)
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group ${
      file.pinned
        ? 'bg-gold-900/10 border-gold-600/20'
        : 'bg-gov-800/50 border-stone-800/50 hover:border-stone-700'
    }`}>
      <div className="w-10 h-10 rounded-lg bg-gov-700 flex items-center justify-center flex-shrink-0">
        {getFileIcon(file.mimeType)}
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
          <span>{file.folder}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={file.blobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-stone-500 hover:text-gold-400 hover:bg-gov-700 transition-all"
          title="Ouvrir"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        <a
          href={file.blobUrl}
          download={file.name}
          className="p-2 rounded-lg text-stone-500 hover:text-blue-400 hover:bg-gov-700 transition-all"
          title="Télécharger"
        >
          <Download className="w-4 h-4" />
        </a>
        <button
          onClick={handlePin}
          disabled={pinning}
          className="p-2 rounded-lg text-stone-500 hover:text-gold-400 hover:bg-gov-700 transition-all disabled:opacity-40"
          title={file.pinned ? 'Désépingler' : 'Épingler'}
        >
          {file.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
        </button>
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-950/30 transition-all disabled:opacity-40"
            title="Supprimer"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({ companyId, companySlug, folder, onUploaded }: {
  companyId: string
  companySlug: string
  folder: FolderType
  onUploaded: (file: FileRecord) => void
}) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    setUploading(true)
    setProgress(`Envoi de ${file.name}...`)
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
      setProgress(err instanceof Error ? err.message : 'Erreur upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [folder])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        dragging ? 'border-gold-500 bg-gold-900/10' : 'border-stone-700 hover:border-stone-600 hover:bg-gov-800/30'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.docx,.xlsx,.png,.jpeg,.jpg"
        onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
          <span className="text-stone-400 text-sm">{progress}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Upload className="w-8 h-8 text-stone-600" />
          <div>
            <p className="text-stone-400 text-sm font-medium">Glissez un fichier ou cliquez</p>
            <p className="text-stone-600 text-xs mt-1">PDF, DOCX, XLSX, PNG, JPEG — 10MB max</p>
          </div>
        </div>

// ─── Company Page ─────────────────────────────────────────────────────────────
export default function CompanyPage() {
  const { slug } = useParams() as { slug: string }
  const company = COMPANIES.find(c => c.slug === slug)

  const [authenticated, setAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [canUpload, setCanUpload] = useState(false)
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [activeFolder, setActiveFolder] = useState<FolderType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [dbCompany, setDbCompany] = useState<{ id: string; name: string } | null>(null)

  // Check session — bypass PIN pour admin/superadmin/consultant
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.authenticated) {
        const role = d.session?.role
        const perms = d.permissions
        // Superadmin/admin/consultant bypass le PIN
        if (role === 'superadmin' || role === 'admin' || role === 'consultant') {
          setIsAdmin(role === 'superadmin' || role === 'admin')
          setCanUpload(perms?.canUploadFiles ?? (role !== 'consultant'))
          setAuthenticated(true)
        } else if (role === 'company' && d.session.companySlug === slug) {
          // Visiteur entreprise: download only
          setCanUpload(false)
          setIsAdmin(false)
          setAuthenticated(true)
        }
      }
    })
  }, [slug])

  // Load files once authenticated
  useEffect(() => {
    if (!authenticated) return
    setLoading(true)
    fetch('/api/companies/list')
      .then(r => r.json())
      .then((companies) => {
        const c = companies.find((x: { slug: string; id: string; name: string }) => x.slug === slug)
        if (c) {
          setDbCompany({ id: c.id, name: c.name })
          return fetch(`/api/files/list?companyId=${c.id}`)
        }
      })
      .then(r => r?.json())
      .then(data => { if (data) setFiles(data) })
      .finally(() => setLoading(false))
  }, [authenticated, slug])

  if (!company) {
    return (
      <div className="min-h-screen bg-gov-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-white mb-2">Entreprise introuvable</h1>
          <Link href="/" className="text-gold-400 hover:underline text-sm">Retour à l'accueil</Link>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <PinEntry
        companyName={company.name}
        slug={slug}
        accentColor={company.accentColor}
        onSuccess={() => setAuthenticated(true)}
      />
    )
  }

  const filtered = files.filter(f => {
    if (activeFolder !== 'all' && f.folder !== activeFolder) return false
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const pinned = filtered.filter(f => f.pinned)
  const regular = filtered.filter(f => !f.pinned)

  return (
    <div className="min-h-screen" style={{ backgroundColor: company.color }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-8"
          style={{ backgroundColor: company.accentColor }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-5"
          style={{ backgroundColor: company.accentColor }} />
      </div>

      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-stone-500 hover:text-stone-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-px h-6 bg-stone-700" />
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: company.accentColor }} />
              <div>
                <h1 className="font-serif text-white font-semibold">{company.name}</h1>
                <p className="text-xs text-stone-500 capitalize">{company.category}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link href="/dashboard"
                className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors px-3 py-1.5 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/20">
                ← Panel admin
              </Link>
            )}
            <span className="flex items-center gap-1.5 text-xs text-stone-500">
              <Unlock className="w-3 h-3" style={{ color: company.accentColor }} />
              {isAdmin ? 'Admin' : canUpload ? 'Consultant' : 'Accès entreprise'}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-4">
            <div className="glass rounded-2xl p-4 border border-white/5">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Dossiers</h3>
              <div className="space-y-1">
                <button onClick={() => setActiveFolder('all')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    activeFolder === 'all' ? 'text-white font-medium' : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
                  }`}
                  style={activeFolder === 'all' ? { backgroundColor: `${company.accentColor}20`, color: company.accentColor } : {}}>
                  <Folder className="w-4 h-4" />
                  Tous les fichiers
                  <span className="ml-auto text-xs opacity-60">{files.length}</span>
                </button>
                {FOLDERS.map((f) => {
                  const count = files.filter(file => file.folder === f).length
                  return (
                    <button key={f} onClick={() => setActiveFolder(f)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        activeFolder === f ? 'text-white font-medium' : 'text-stone-400 hover:text-stone-200 hover:bg-white/5'
                      }`}
                      style={activeFolder === f ? { backgroundColor: `${company.accentColor}20`, color: company.accentColor } : {}}>
                      <span>{FOLDER_ICONS[f]}</span>{f}
                      <span className="ml-auto text-xs opacity-60">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Upload — uniquement si canUpload */}
            {canUpload && dbCompany && (
              <div className="glass rounded-2xl p-4 border border-white/5">
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
                  Déposer dans: {activeFolder === 'all' ? 'Financier' : activeFolder}
                </h3>
                <UploadZone
                  companyId={dbCompany.id}
                  companySlug={slug}
                  folder={activeFolder === 'all' ? 'Financier' : activeFolder}
                  onUploaded={(f) => setFiles(prev => [f, ...prev])}
                />
              </div>
            )}

            {/* Message lecture seule pour visiteurs */}
            {!canUpload && (
              <div className="glass rounded-2xl p-4 border border-white/5 text-center">
                <Lock className="w-4 h-4 mx-auto mb-2 text-stone-600" />
                <p className="text-xs text-stone-600">Accès lecture seule</p>
                <p className="text-xs text-stone-700 mt-1">Téléchargement uniquement</p>
              </div>
            )}
          </aside>

          <main className="lg:col-span-3 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input type="text" placeholder="Rechercher un fichier..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gov-800/80 border border-stone-700/50 focus:border-stone-600 text-white text-sm outline-none transition-all" />
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
                      <FileRow key={f.id} file={f} isAdmin={isAdmin}
                        onDelete={(id) => setFiles(prev => prev.filter(x => x.id !== id))}
                        onPin={(id, p) => setFiles(prev => prev.map(x => x.id === id ? { ...x, pinned: p } : x))}
                      />
                    ))}
                  </div>
                )}
                {regular.length > 0 ? (
                  <div className="space-y-2">
                    {pinned.length > 0 && <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Fichiers</h3>}
                    {regular.map(f => (
                      <FileRow key={f.id} file={f} isAdmin={isAdmin}
                        onDelete={(id) => setFiles(prev => prev.filter(x => x.id !== id))}
                        onPin={(id, p) => setFiles(prev => prev.map(x => x.id === id ? { ...x, pinned: p } : x))}
                      />
                    ))}
                  </div>
                ) : (
                  filtered.length === 0 && (
                    <div className="text-center py-20 text-stone-600">
                      <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">{search ? 'Aucun fichier trouvé' : 'Aucun fichier dans ce dossier'}</p>
                      <p className="text-xs mt-1 opacity-60">
                        {canUpload ? 'Déposez un fichier pour commencer' : 'Aucun fichier disponible'}
                      </p>
                    </div>
                  )
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

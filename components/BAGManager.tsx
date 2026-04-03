'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Plus, Save, Download, Trash2, ChevronLeft, ChevronRight, Loader2, Check, X, Eye, Lock } from 'lucide-react'
import { BAGDocument, BAGStatus, UserRole } from '@/types'

// ── Types locaux ──────────────────────────────────────────────────────────────
type View = 'list' | 'edit'

const STATUS_LABELS: Record<BAGStatus, { label: string; color: string; bg: string }> = {
  brouillon:  { label: 'Brouillon',  color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
  finalise:   { label: 'Finalisé',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  transmis:   { label: 'Transmis',   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  archive:    { label: 'Archivé',    color: 'text-stone-400',  bg: 'bg-stone-500/10 border-stone-500/20' },
}

// ── Composant champ texte ─────────────────────────────────────────────────────
function Field({ label, field, bag, onChange, multiline = false, placeholder = '' }: {
  label: string; field: keyof BAGDocument; bag: BAGDocument
  onChange: (f: keyof BAGDocument, v: string) => void
  multiline?: boolean; placeholder?: string
}) {
  const value = (bag[field] as string) ?? ''
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-stone-400 uppercase tracking-wider">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(field, e.target.value)}
          placeholder={placeholder || `[ ${label} ]`}
          rows={3}
          className="w-full bg-gov-700/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-gold-500/40 resize-y"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(field, e.target.value)}
          placeholder={placeholder || `[ ${label} ]`}
          className="w-full bg-gov-700/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-stone-600 focus:outline-none focus:border-gold-500/40"
        />
      )}
    </div>
  )
}

// ── Composant checkbox ────────────────────────────────────────────────────────
function CB({ cbKey, label, bag, onChange, color = '' }: {
  cbKey: string; label: string; bag: BAGDocument
  onChange: (k: string, v: boolean) => void; color?: string
}) {
  const checked = bag.checkboxes[cbKey as keyof typeof bag.checkboxes]
  return (
    <button
      onClick={() => onChange(cbKey, !checked)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
        checked
          ? 'bg-gold-500/15 border-gold-500/40 text-gold-300'
          : 'bg-gov-700/40 border-white/10 text-stone-400 hover:border-white/20 hover:text-stone-300'
      } ${color}`}
    >
      <span className="text-base">{checked ? '☑' : '☐'}</span>
      <span>{label}</span>
    </button>
  )
}

// ── Groupes de checkboxes ─────────────────────────────────────────────────────
function CBGroup({ title, items, bag, onChange }: {
  title: string; items: { key: string; label: string; color?: string }[]
  bag: BAGDocument; onChange: (k: string, v: boolean) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-stone-500 uppercase tracking-wider">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map(({ key, label, color }) => (
          <CB key={key} cbKey={key} label={label} bag={bag} onChange={onChange} color={color} />
        ))}
      </div>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionTitle({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mt-8 mb-4">
      <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
        <span className="text-gold-400 text-xs font-bold font-serif">{num}</span>
      </div>
      <h3 className="text-base font-semibold text-white font-serif">{title}</h3>
      <div className="flex-1 h-px bg-gold-600/15" />
    </div>
  )
}

function SubTitle({ title }: { title: string }) {
  return <h4 className="text-sm font-semibold text-gold-400/80 mt-5 mb-3 flex items-center gap-2">
    <span className="text-gold-600">◆</span> {title}
  </h4>
}

// ── Composant principal ───────────────────────────────────────────────────────
export function BAGManager({ myRole, myUserId }: { myRole: UserRole; myUserId: string }) {
  const [view, setView] = useState<View>('list')
  const [bags, setBags] = useState<BAGDocument[]>([])
  const [current, setCurrent] = useState<BAGDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [filterStatus, setFilterStatus] = useState<BAGStatus | 'all'>('all')
  const [filterMine, setFilterMine] = useState(myRole === 'consultant')
  const isFullAccess = myRole === 'superadmin' || myRole === 'admin'

  // Charger les BAGs
  const loadBags = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/bags')
      .then(r => r.json())
      .then(data => { setBags(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { loadBags() }, [loadBags])

  // Créer un nouveau BAG
  async function createNew() {
    const res = await fetch('/api/admin/bags', { method: 'POST' })
    const data = await res.json()
    if (data.bag) {
      setBags(prev => [data.bag, ...prev])
      setCurrent(data.bag)
      setView('edit')
    }
  }

  // Sauvegarder
  async function save() {
    if (!current) return
    setSaving(true)
    await fetch('/api/admin/bags', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(current),
    })
    setBags(prev => prev.map(b => b.id === current.id ? current : b))
    setSaving(false)
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 2000)
  }

  // Supprimer
  async function deleteBag(id: string) {
    if (!confirm('Supprimer ce BAG définitivement ?')) return
    await fetch(`/api/admin/bags?id=${id}`, { method: 'DELETE' })
    setBags(prev => prev.filter(b => b.id !== id))
    if (current?.id === id) { setCurrent(null); setView('list') }
  }

  // Exporter DOCX
  async function exportDocx() {
    if (!current) return
    setExporting(true)
    // 1. Sauvegarder d'abord
    await fetch('/api/admin/bags', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(current),
    })
    // 2. Télécharger le DOCX
    const res = await fetch(`/api/admin/bags/export?id=${current.id}`)
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const rawName = (current.entreprise || 'Document').replace(/[^a-zA-Z0-9]/g, '_')
      const dateStr = current.dateAudit?.replace(/\//g, '-') || new Date().toISOString().split('T')[0]
      a.download = `BAG_${rawName}_${dateStr}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      const data = await res.json().catch(() => ({}))
      alert(`Erreur export: ${data.error || 'Vérifiez la console'}`)
    }
    setExporting(false)
  }

  // Modifier un champ
  function setField(field: keyof BAGDocument, value: string) {
    if (!current) return
    setCurrent(prev => prev ? { ...prev, [field]: value } : prev)
  }

  // Modifier une checkbox
  function setCB(key: string, value: boolean) {
    if (!current) return
    setCurrent(prev => prev ? { ...prev, checkboxes: { ...prev.checkboxes, [key]: value } } : prev)
  }

  // Changer le statut
  function setStatus(status: BAGStatus) {
    if (!current) return
    setCurrent(prev => prev ? { ...prev, status } : prev)
  }

  // Filtrage
  const displayed = bags.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false
    if (filterMine && b.ownerId !== myUserId) return false
    return true
  })

  // ── VUE LISTE ─────────────────────────────────────────────────────────────
  if (view === 'list') return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold-400" />
            Bilans d'Audit Global (B.A.G.)
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">Templates éditables — export DOCX</p>
        </div>
        <button onClick={createNew}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500/10 border border-gold-500/30 rounded-xl text-gold-400 hover:bg-gold-500/20 transition-all text-sm font-medium">
          <Plus className="w-4 h-4" /> Nouveau B.A.G.
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3 flex-wrap">
        {(['all', 'brouillon', 'finalise', 'transmis', 'archive'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filterStatus === s
                ? 'bg-gold-500/15 border-gold-500/40 text-gold-300'
                : 'bg-gov-700/40 border-white/10 text-stone-400 hover:text-stone-300'
            }`}>
            {s === 'all' ? 'Tous' : STATUS_LABELS[s].label}
          </button>
        ))}
        {isFullAccess && (
          <button onClick={() => setFilterMine(!filterMine)}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-all flex items-center gap-1.5 ${
              filterMine ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-gov-700/40 border-white/10 text-stone-400 hover:text-stone-300'
            }`}>
            <Lock className="w-3 h-3" /> {filterMine ? 'Mes BAGs' : 'Tous les BAGs'}
          </button>
        )}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold-400" /></div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-stone-600">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun B.A.G.{filterMine ? ' personnel' : ''}</p>
          <button onClick={createNew} className="mt-3 text-gold-500 text-sm hover:underline">Créer le premier →</button>
        </div>
      ) : (
        <div className="grid gap-3">
          {displayed.map(bag => (
            <div key={bag.id}
              className="glass rounded-2xl p-4 border border-white/5 hover:border-gold-500/15 transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-gold-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">
                      {bag.entreprise || <span className="text-stone-500 italic">Sans titre</span>}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_LABELS[bag.status].bg} ${STATUS_LABELS[bag.status].color}`}>
                        {STATUS_LABELS[bag.status].label}
                      </span>
                      <span className="text-xs text-stone-600">{bag.ownerLabel}</span>
                      <span className="text-xs text-stone-600">{new Date(bag.updatedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setCurrent(bag); setView('edit') }}
                    className="p-2 rounded-lg text-stone-500 hover:text-gold-400 hover:bg-gold-500/10 transition-all" title="Éditer">
                    <Eye className="w-4 h-4" />
                  </button>
                  {(isFullAccess || bag.ownerId === myUserId) && (
                    <button onClick={() => deleteBag(bag.id)}
                      className="p-2 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button onClick={() => { setCurrent(bag); setView('edit') }}
                  className="ml-2 p-1.5 rounded-lg text-stone-600 hover:text-gold-400 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── VUE ÉDITION ───────────────────────────────────────────────────────────
  if (!current) return null

  return (
    <div className="space-y-0">
      {/* Barre d'actions sticky */}
      <div className="sticky top-0 z-30 glass border-b border-white/5 px-6 py-3 -mx-8 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { save(); setView('list') }}
            className="flex items-center gap-1.5 text-stone-400 hover:text-white text-sm transition-colors">
            <ChevronLeft className="w-4 h-4" /> Retour
          </button>
          <div className="w-px h-4 bg-stone-700" />
          <span className="text-sm text-white font-medium truncate max-w-xs">
            {current.entreprise || 'Nouveau B.A.G.'}
          </span>
          {/* Statut */}
          <div className="flex items-center gap-1">
            {(['brouillon', 'finalise', 'transmis', 'archive'] as BAGStatus[]).map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-2 py-1 rounded text-xs border transition-all ${
                  current.status === s ? `${STATUS_LABELS[s].bg} ${STATUS_LABELS[s].color}` : 'text-stone-600 border-transparent hover:text-stone-400'
                }`}>
                {STATUS_LABELS[s].label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all ${
              saveOk ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-gov-700 border-white/10 text-stone-300 hover:border-gold-500/30 hover:text-gold-400'
            }`}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saveOk ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saveOk ? 'Sauvegardé' : 'Sauvegarder'}
          </button>
          <button onClick={exportDocx} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gold-500/10 border border-gold-500/30 text-gold-400 hover:bg-gold-500/20 transition-all">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export DOCX
          </button>
        </div>
      </div>

      {/* ── EN-TÊTE DU BAG ── */}
      <div className="glass rounded-2xl p-5 border border-gold-500/10 mb-6">
        <p className="text-xs text-gold-500/70 font-mono uppercase tracking-widest mb-4">B.A.G. — Bilan d'Audit Global · Confidentiel</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Entreprise auditée" field="entreprise" bag={current} onChange={setField} />
          <Field label="Secteur / Pôle" field="secteur" bag={current} onChange={setField} />
          <Field label="Réf. dossier (ex: BAG-2026-001)" field="refDossier" bag={current} onChange={setField} />
          <Field label="Date de l'audit" field="dateAudit" bag={current} onChange={setField} placeholder="JJ/MM/AAAA" />
          <Field label="Période contrôlée" field="periodeControlee" bag={current} onChange={setField} />
          <Field label="Contrôleur fiscal (nom)" field="cfNom" bag={current} onChange={setField} />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <CBGroup title="Type de contrôle" bag={current} onChange={setCB} items={[
            { key: 'ctrlRoutine', label: 'Routine' },
            { key: 'ctrlAnomalie', label: 'Suite à anomalie' },
            { key: 'ctrlReprise', label: 'Reprise d\'activité' },
          ]} />
          <CBGroup title="État financier global" bag={current} onChange={setCB} items={[
            { key: 'etatStable', label: 'Stable', color: 'hover:border-emerald-500/30' },
            { key: 'etatMoyen', label: 'Moyen', color: 'hover:border-amber-500/30' },
            { key: 'etatMauvais', label: 'Mauvais', color: 'hover:border-red-500/30' },
          ]} />
        </div>
      </div>

      {/* ── SECTION I ── */}
      <SectionTitle num="I" title="Cadre Juridique & Contexte de l'Audit" />
      <div className="glass rounded-2xl p-5 border border-white/5 space-y-4">
        <SubTitle title="1.1 Identification du gestionnaire" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Identité patron/co-patron" field="idGestionnaire" bag={current} onChange={setField} placeholder="Nom Prénom — Titre" />
          <Field label="Date de prise de fonction" field="datePriseFonction" bag={current} onChange={setField} placeholder="JJ/MM/AAAA" />
        </div>
        <Field label="Contexte de l'audit" field="contexteAudit" bag={current} onChange={setField}
          multiline placeholder="Contrôle de routine / Anomalie détectée / Reprise d'activité — préciser le contexte" />

        <SubTitle title="1.2 Transparence & coopération" />
        <CBGroup title="Niveau de coopération" bag={current} onChange={setCB} items={[
          { key: 'coopTotale', label: 'Totale', color: 'hover:border-emerald-500/30' },
          { key: 'coopPartielle', label: 'Partielle', color: 'hover:border-amber-500/30' },
          { key: 'coopRefus', label: 'Refus', color: 'hover:border-red-500/30' },
        ]} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Note de coopération" field="cooperationNote" bag={current} onChange={setField} />
          <Field label="Observations comportementales" field="observationsComportement" bag={current} onChange={setField} multiline />
        </div>
      </div>

      {/* ── SECTION II ── */}
      <SectionTitle num="II" title="Analyse Opérationnelle" />
      <div className="glass rounded-2xl p-5 border border-white/5 space-y-4">
        <SubTitle title="2.1 Situation du personnel" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Effectif actuel (nombre)" field="effectifActuel" bag={current} onChange={setField} />
          <Field label="Postes vacants / commentaire" field="postesVacants" bag={current} onChange={setField} />
        </div>
        <CBGroup title="Stabilité des équipes" bag={current} onChange={setCB} items={[
          { key: 'stableEquipes', label: 'Stable' },
          { key: 'turnover', label: 'Turnover élevé' },
          { key: 'recrutement', label: 'Recrutement en cours' },
        ]} />

        <SubTitle title="2.2 Capacité d'exploitation" />
        <Field label="Horaires d'ouverture" field="horaireOuverture" bag={current} onChange={setField} placeholder="Jours / plages horaires" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CBGroup title="Maîtrise des stocks" bag={current} onChange={setCB} items={[
            { key: 'stockBonne', label: 'Bonne' }, { key: 'stockMoyenne', label: 'Moyenne' }, { key: 'stockInsuffisante', label: 'Insuffisante' },
          ]} />
          <CBGroup title="Flux de clientèle" bag={current} onChange={setCB} items={[
            { key: 'fluxRegulier', label: 'Régulier' }, { key: 'fluxIrregulier', label: 'Irrégulier' }, { key: 'fluxFaible', label: 'Faible' },
          ]} />
          <CBGroup title="Modèle économique" bag={current} onChange={setCB} items={[
            { key: 'modPassage', label: 'Clientèle de passage' }, { key: 'modContrats', label: 'Contrats' }, { key: 'modMixte', label: 'Mixte' },
          ]} />
          <CBGroup title="Dépendance externe" bag={current} onChange={setCB} items={[
            { key: 'depAutonome', label: 'Autonome' }, { key: 'depPartielle', label: 'Partiellement' }, { key: 'depTres', label: 'Très dépendante' },
          ]} />
        </div>

        <SubTitle title="2.3 Difficultés opérationnelles identifiées" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Difficulté #1" field="diffOp1" bag={current} onChange={setField} placeholder="Manque personnel / Zone / Concurrence..." />
          <Field label="Difficulté #2 (si applicable)" field="diffOp2" bag={current} onChange={setField} />
          <Field label="Difficulté #3 (si applicable)" field="diffOp3" bag={current} onChange={setField} />
        </div>
      </div>

      {/* ── SECTION III ── */}
      <SectionTitle num="III" title="Bilan Comptable & Décisionnel" />
      <div className="glass rounded-2xl p-5 border border-white/5 space-y-5">
        <SubTitle title="3.1 État de la trésorerie" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Trésorerie déclarée ($)" field="tresorerieDeclaree" bag={current} onChange={setField} />
          <Field label="Trésorerie réelle ($)" field="tresorerieReelle" bag={current} onChange={setField} />
          <Field label="Solde après frais ($)" field="soldeApresFrags" bag={current} onChange={setField} />
          <Field label="Impôt dû estimé ($)" field="impotDu" bag={current} onChange={setField} />
          <Field label="Taux applicable (%)" field="tauxRef" bag={current} onChange={setField} />
          <Field label="Écart constaté ($)" field="ecartTreso" bag={current} onChange={setField} />
        </div>
        <CBGroup title="Conformité trésorerie" bag={current} onChange={setCB} items={[
          { key: 'tresOK', label: '✓ OK' }, { key: 'tresKO', label: '✗ KO — anomalie' },
        ]} />

        <SubTitle title="3.2 Vérification des déclarations" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 text-stone-400 font-medium">Semaine</th>
                <th className="text-center py-2 px-3 text-stone-400 font-medium">Déclaration</th>
                <th className="text-center py-2 px-3 text-stone-400 font-medium">Paiement</th>
                <th className="text-center py-2 px-3 text-stone-400 font-medium">Justificatifs</th>
                <th className="text-left py-2 px-3 text-stone-400 font-medium">Anomalie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { label: 'S-3', decl: 's3Decl', paie: 's3Paie', just: 's3Just', anom: 's3Anomalie' },
                { label: 'S-2', decl: 's2Decl', paie: 's2Paie', just: 's2Just', anom: 's2Anomalie' },
                { label: 'S-1', decl: 's1Decl', paie: 's1Paie', just: 's1Just', anom: 's1Anomalie' },
              ].map(row => (
                <tr key={row.label} className="hover:bg-white/2">
                  <td className="py-2 px-3 font-medium text-white">{row.label}</td>
                  <td className="py-2 px-3 text-center">
                    <button onClick={() => setCB(row.decl, !current.checkboxes[row.decl as keyof typeof current.checkboxes])}
                      className="text-lg hover:scale-110 transition-transform">
                      {current.checkboxes[row.decl as keyof typeof current.checkboxes] ? '☑' : '☐'}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button onClick={() => setCB(row.paie, !current.checkboxes[row.paie as keyof typeof current.checkboxes])}
                      className="text-lg hover:scale-110 transition-transform">
                      {current.checkboxes[row.paie as keyof typeof current.checkboxes] ? '☑' : '☐'}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button onClick={() => setCB(row.just, !current.checkboxes[row.just as keyof typeof current.checkboxes])}
                      className="text-lg hover:scale-110 transition-transform">
                      {current.checkboxes[row.just as keyof typeof current.checkboxes] ? '☑' : '☐'}
                    </button>
                  </td>
                  <td className="py-2 px-3">
                    <input value={(current[row.anom as keyof BAGDocument] as string) || ''} onChange={e => setField(row.anom as keyof BAGDocument, e.target.value)}
                      placeholder="—" className="w-full bg-transparent text-sm text-white placeholder-stone-600 outline-none border-b border-white/10 focus:border-gold-500/30 py-0.5" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Field label="Détail des anomalies" field="detailAnomalie" bag={current} onChange={setField} multiline placeholder="Description précise, calcul des écarts..." />

        <SubTitle title="3.3 Qualification de la situation fiscale" />
        <CBGroup title="" bag={current} onChange={setCB} items={[
          { key: 'casSImple', label: 'Cas simple — erreurs mineures' },
          { key: 'casGrave', label: 'Cas grave — fraude / dissimulation', color: 'hover:border-red-500/30' },
          { key: 'conformite', label: '✓ Conformité — aucune anomalie', color: 'hover:border-emerald-500/30' },
        ]} />
      </div>

      {/* ── SECTION IV ── */}
      <SectionTitle num="IV" title="Préconisations & Conclusions" />
      <div className="glass rounded-2xl p-5 border border-white/5 space-y-5">
        <SubTitle title="4.1 Analyse de viabilité" />
        <Field label="Conclusion de viabilité" field="conclusionViabilite" bag={current} onChange={setField} multiline
          placeholder="Stable / Précaire / Critique — justification..." />

        <SubTitle title="4.2 Préconisations officielles" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-3">
            {[
              { key: 'redressement', label: 'Redressement fiscal', amtKey: 'montantRedressement' as keyof BAGDocument },
              { key: 'amende', label: 'Amende pour retard', amtKey: 'montantAmende' as keyof BAGDocument },
              { key: 'subvFonctionnement', label: 'Subvention fonctionnement', amtKey: 'montantSubvFonct' as keyof BAGDocument },
              { key: 'subvUrgence', label: 'Subvention urgence', amtKey: 'montantSubvUrgence' as keyof BAGDocument },
            ].map(({ key, label, amtKey }) => (
              <div key={key} className="flex items-center gap-3">
                <CB cbKey={key} label={label} bag={current} onChange={setCB} />
                {current.checkboxes[key as keyof typeof current.checkboxes] && (
                  <input value={(current[amtKey] as string) || ''} onChange={e => setField(amtKey, e.target.value)}
                    placeholder="Montant $" className="flex-1 bg-gov-700/60 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-gold-500/40" />
                )}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[
              { key: 'exoneration', label: 'Exonération fiscale' },
              { key: 'aideRH', label: 'Aide recrutement / formation' },
              { key: 'fermeture', label: 'Fermeture administrative' },
              { key: 'fraude', label: 'Dossier Fraude Fiscale' },
            ].map(({ key, label }) => (
              <CB key={key} cbKey={key} label={label} bag={current} onChange={setCB} />
            ))}
            {current.checkboxes.exoneration && (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Durée exonération" field="dureeExoneration" bag={current} onChange={setField} placeholder="X semaines" />
                <Field label="Motif" field="motifExoneration" bag={current} onChange={setField} />
              </div>
            )}
            <Field label="Autre préconisation" field="autrePreco" bag={current} onChange={setField} />
          </div>
        </div>
        <Field label="Détail des préconisations" field="preconisationsDetail" bag={current} onChange={setField} multiline />

        <SubTitle title="4.3 Résumé Discord (2 lignes max)" />
        <div className="bg-gov-800/60 rounded-xl border border-stone-700/30 p-3">
          <p className="text-xs text-stone-500 mb-2 font-mono">Format post Discord :</p>
          <textarea
            value={current.resumeDiscord}
            onChange={e => setField('resumeDiscord', e.target.value)}
            rows={4}
            placeholder={`Entreprise : ${current.entreprise || '[Entreprise]'}\nÉtat financier : [Stable/Moyen/Mauvais]\nSituation : [Résumé 1-2 lignes]\nSubvention reçue : [Montant ou ×]`}
            className="w-full bg-transparent text-sm text-stone-300 font-mono placeholder-stone-600 focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* ── ANNEXE A ── */}
      <SectionTitle num="A" title="Annexe A — Expertise Comptable & Conseil Entreprise" />
      <div className="glass rounded-2xl p-5 border border-white/5 space-y-5">
        <SubTitle title="A.1 Analyse du modèle économique" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Source principale de revenus" field="sourceRevenuPrincipal" bag={current} onChange={setField} />
          <Field label="Sources secondaires" field="sourceRevenuSecondaire" bag={current} onChange={setField} />
          <Field label="Dépendance à des tiers" field="dependanceTiers" bag={current} onChange={setField} />
        </div>
        <p className="text-xs text-stone-500 font-medium mt-2">Structure des charges :</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { f: 'chargesStocks' as keyof BAGDocument, l: 'Stocks ($)' },
            { f: 'chargesSalaires' as keyof BAGDocument, l: 'Salaires ($)' },
            { f: 'chargesOp' as keyof BAGDocument, l: 'Opérationnel ($)' },
            { f: 'chargesImpots' as keyof BAGDocument, l: 'Impôts ($)' },
            { f: 'chargesAutres' as keyof BAGDocument, l: 'Autres ($)' },
          ].map(({ f, l }) => <Field key={f} label={l} field={f} bag={current} onChange={setField} />)}
        </div>

        <SubTitle title="A.2 Calcul des amendes applicables" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/10">
              <th className="text-left py-2 px-2 text-stone-400">Infraction</th>
              <th className="text-center py-2 px-2 text-stone-400">Barème</th>
              <th className="text-left py-2 px-2 text-stone-400">Montant calculé ($)</th>
              <th className="text-left py-2 px-2 text-stone-400">Calcul/Justif.</th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {[
                { lbl: 'Retard décl. Évèn./LTD/Resto.', bar: '700$/h', mKey: 'montantAmRetardEvt', cKey: 'calcAmRetardEvt' },
                { lbl: 'Retard décl. Prod./Util./Pol.', bar: '2 000$/h', mKey: 'montantAmRetardProd', cKey: 'calcAmRetardProd' },
                { lbl: 'Retard paiement < 24h', bar: '+2%', mKey: 'montantAmRetard24h', cKey: null },
                { lbl: 'Retard paiement 24-48h', bar: '+5%', mKey: 'montantAmRetard48h', cKey: null },
                { lbl: 'Retard paiement 48-72h', bar: '+10%', mKey: 'montantAmRetard72h', cKey: null },
                { lbl: 'Document manquant', bar: '2%', mKey: 'montantAmDocManquant', cKey: null },
                { lbl: 'Déduction non justifiée', bar: '6%', mKey: 'montantAmDeductNonJust', cKey: null },
              ].map(({ lbl, bar, mKey, cKey }) => (
                <tr key={mKey} className="hover:bg-white/2">
                  <td className="py-1.5 px-2 text-stone-300">{lbl}</td>
                  <td className="py-1.5 px-2 text-center text-amber-400 font-mono">{bar}</td>
                  <td className="py-1.5 px-2">
                    <input value={(current[mKey as keyof BAGDocument] as string) || ''} onChange={e => setField(mKey as keyof BAGDocument, e.target.value)}
                      placeholder="—" className="w-full bg-transparent text-white placeholder-stone-600 outline-none border-b border-white/10 focus:border-gold-500/30" />
                  </td>
                  <td className="py-1.5 px-2">
                    {cKey && <input value={(current[cKey as keyof BAGDocument] as string) || ''} onChange={e => setField(cKey as keyof BAGDocument, e.target.value)}
                      placeholder="—" className="w-full bg-transparent text-stone-400 placeholder-stone-600 outline-none border-b border-white/10 focus:border-gold-500/30" />}
                  </td>
                </tr>
              ))}
              <tr className="bg-gold-500/5 border-t-2 border-gold-500/20">
                <td colSpan={2} className="py-1.5 px-2 font-bold text-gold-400 text-xs">TOTAL AMENDES</td>
                <td className="py-1.5 px-2">
                  <input value={current.totalAmendes} onChange={e => setField('totalAmendes', e.target.value)}
                    placeholder="—" className="w-full bg-transparent text-gold-300 font-bold placeholder-stone-600 outline-none" />
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        <SubTitle title="A.3 Analyse des subventions" />
        <p className="text-xs text-stone-500 mb-3">En cas de demande de subvention, complétez cette section pour instruire le dossier :</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/10">
              <th className="text-left py-2 px-2 text-stone-400">Type de subvention</th>
              <th className="text-center py-2 px-2 text-stone-400 w-20">Demandée</th>
              <th className="text-left py-2 px-2 text-stone-400">Montant ($)</th>
              <th className="text-left py-2 px-2 text-stone-400">Motif</th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {[
                { lbl: 'Fonctionnement (trésorerie)', ck: 'subvFonctionnement', mKey: 'montantSubvFonct' as keyof BAGDocument, mKey2: null, motKey: null },
                { lbl: 'Événementielle (projet)', ck: null, mKey: 'montantSubvEvt' as keyof BAGDocument, mKey2: null, motKey: 'motifSubvEvt' as keyof BAGDocument },
                { lbl: 'Investissement (équipement)', ck: null, mKey: 'montantSubvInvest' as keyof BAGDocument, mKey2: null, motKey: 'motifSubvInvest' as keyof BAGDocument },
                { lbl: "Urgence (difficultés majeures)", ck: 'subvUrgence', mKey: 'montantSubvUrgence' as keyof BAGDocument, mKey2: null, motKey: null },
                { lbl: 'Formation', ck: null, mKey: 'montantSubvFormation' as keyof BAGDocument, mKey2: null, motKey: 'motifSubvFormation' as keyof BAGDocument },
              ].map(({ lbl, ck, mKey, motKey }) => (
                <tr key={lbl} className="hover:bg-white/2">
                  <td className="py-1.5 px-2 text-stone-300">{lbl}</td>
                  <td className="py-1.5 px-2 text-center">
                    {ck ? (
                      <button onClick={() => setCB(ck, !current.checkboxes[ck as keyof typeof current.checkboxes])}
                        className="text-lg hover:scale-110 transition-transform">
                        {current.checkboxes[ck as keyof typeof current.checkboxes] ? '☑' : '☐'}
                      </button>
                    ) : <span className="text-stone-600">—</span>}
                  </td>
                  <td className="py-1.5 px-2">
                    <input value={(current[mKey] as string) || ''} onChange={e => setField(mKey, e.target.value)}
                      placeholder="—" className="w-full bg-transparent text-white placeholder-stone-600 outline-none border-b border-white/10 focus:border-gold-500/30" />
                  </td>
                  <td className="py-1.5 px-2">
                    {motKey && <input value={(current[motKey] as string) || ''} onChange={e => setField(motKey, e.target.value)}
                      placeholder="—" className="w-full bg-transparent text-stone-400 placeholder-stone-600 outline-none border-b border-white/10 focus:border-gold-500/30" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubTitle title="A.4 Recommandations stratégiques" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Court terme (cette semaine)" field="recourtTerme" bag={current} onChange={setField} multiline />
          <Field label="Moyen terme (2-3 semaines)" field="recoMoyenTerme" bag={current} onChange={setField} multiline />
          <Field label="Long terme / Expansion" field="recoLongTerme" bag={current} onChange={setField} multiline />
          <Field label="Points d'attention — risques" field="pointsAttention" bag={current} onChange={setField} multiline />
        </div>
      </div>

        <SubTitle title="A.5 Trame entretien B.A.G. — Rappel conducteur" />
        <div className="bg-gov-800/40 rounded-xl border border-white/5 p-4 space-y-1.5">
          <p className="text-xs text-stone-400 mb-2 font-medium">Points obligatoires à aborder lors de l'entretien :</p>
          {[
            "Présentation de l'agent : « Bonjour, je suis [Nom], contrôleur fiscal au Department of Finance. »",
            "Vérification identité : Patron / Co-patron / Gérant",
            "Trésorerie : Montant exact en banque — noter précisément",
            "Ressenti : Santé financière — Confortable / Tendue ?",
            "Modèle économique : Clientèle de passage ou contrats ?",
            "Écoulement des stocks : Facilement ? Difficultés ?",
            "Difficultés : Manque personnel / Zone géo / Concurrence ?",
            "Déclarations fiscales : Procédure comprise ? Retards ?",
            "Aide gouvernementale : Besoin de subvention ?",
            "RH : Besoin aide recrutement ou formation managers ?",
            "Ouverture : Questions du patron pour le Gouvernement ?",
            "Clôture : Informer qu'un B.A.G. sera rédigé et transmis au DOF",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-stone-300">
              <span className="text-gold-600 flex-shrink-0 mt-0.5">▸</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ANNEXE B — PJ ── */}
      <SectionTitle num="B" title="Annexe B — Index des pièces justificatives" />
      <div className="glass rounded-2xl p-5 border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/10">
              <th className="text-left py-2 px-2 text-stone-400 w-16">Réf.</th>
              <th className="text-left py-2 px-2 text-stone-400">Nature du document</th>
              <th className="text-left py-2 px-2 text-stone-400 w-28">Date</th>
              <th className="text-center py-2 px-2 text-stone-400 w-28">Statut</th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {[
                { ref: 'PJ-01', desc: 'Relevé bancaire S-3 — Avant/Après frais', dKey: 'pj01date', cbKey: 'pj01' },
                { ref: 'PJ-02', desc: 'Relevé bancaire S-2 — Avant/Après frais', dKey: 'pj02date', cbKey: 'pj02' },
                { ref: 'PJ-03', desc: 'Relevé bancaire S-1 — Avant/Après frais', dKey: 'pj03date', cbKey: 'pj03' },
                { ref: 'PJ-04', desc: 'Capture paiement impôts S-3', dKey: 'pj04date', cbKey: 'pj04' },
                { ref: 'PJ-05', desc: 'Capture paiement impôts S-2', dKey: 'pj05date', cbKey: 'pj05' },
                { ref: 'PJ-06', desc: 'Capture paiement impôts S-1', dKey: 'pj06date', cbKey: 'pj06' },
                { ref: 'PJ-07', desc: current.pj07desc || 'Capture anomalie #1', dKey: 'pj07date', cbKey: 'pj07', editable: true, descKey: 'pj07desc' },
                { ref: 'PJ-08', desc: current.pj08desc || 'Capture anomalie #2', dKey: 'pj08date', cbKey: 'pj08', editable: true, descKey: 'pj08desc' },
                { ref: 'PJ-09', desc: 'Réponse écrite du patron', dKey: 'pj09date', cbKey: 'pj09' },
                { ref: 'PJ-10', desc: current.pj10desc || '[ Autre document ]', dKey: 'pj10date', cbKey: 'pj10', editable: true, descKey: 'pj10desc' },
              ].map(({ ref, desc, dKey, cbKey, editable, descKey }) => (
                <tr key={ref} className="hover:bg-white/2">
                  <td className="py-2 px-2 font-mono text-gold-400 font-bold">{ref}</td>
                  <td className="py-2 px-2 text-stone-300">
                    {editable && descKey
                      ? <input value={(current[descKey as keyof BAGDocument] as string) || ''} onChange={e => setField(descKey as keyof BAGDocument, e.target.value)}
                          placeholder={desc} className="w-full bg-transparent text-stone-300 placeholder-stone-600 outline-none border-b border-white/10 focus:border-gold-500/30" />
                      : desc}
                  </td>
                  <td className="py-2 px-2">
                    <input value={(current[dKey as keyof BAGDocument] as string) || ''} onChange={e => setField(dKey as keyof BAGDocument, e.target.value)}
                      placeholder="JJ/MM" className="w-full bg-transparent text-stone-400 placeholder-stone-600 outline-none border-b border-white/10 focus:border-gold-500/30" />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button onClick={() => setCB(cbKey, !current.checkboxes[cbKey as keyof typeof current.checkboxes])}
                      className={`text-sm px-2 py-0.5 rounded border transition-all ${
                        current.checkboxes[cbKey as keyof typeof current.checkboxes]
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/15'
                      }`}>
                      {current.checkboxes[cbKey as keyof typeof current.checkboxes] ? '☑ Reçu' : '☐ Manquant'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SIGNATURE ── */}
      <SectionTitle num="✦" title="Certification & Signature" />
      <div className="glass rounded-2xl p-5 border border-gold-500/10 space-y-4">
        <p className="text-xs text-stone-500 italic">Je soussigné(e), certifie sur l'honneur l'exactitude des informations contenues dans le présent rapport.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Fait le (date)" field="dateFait" bag={current} onChange={setField} placeholder="JJ/MM/AAAA" />
          <Field label="Contrôleur fiscal (signature)" field="nomCF" bag={current} onChange={setField} />
          <Field label="Validé par DOF/Co-DOF" field="nomDOF" bag={current} onChange={setField} />
        </div>
      </div>

      {/* Boutons bas de page */}
      <div className="flex justify-end gap-3 pt-4 pb-8">
        <button onClick={() => { save(); setView('list') }}
          className="flex items-center gap-2 px-4 py-2 bg-gov-700 border border-white/10 rounded-xl text-stone-300 hover:text-white transition-all text-sm">
          <ChevronLeft className="w-4 h-4" /> Retour à la liste
        </button>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gov-700 border border-gold-500/20 rounded-xl text-gold-400 hover:bg-gold-500/10 transition-all text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Sauvegarder
        </button>
        <button onClick={exportDocx} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500/10 border border-gold-500/30 rounded-xl text-gold-300 hover:bg-gold-500/20 transition-all text-sm font-medium">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exporter en DOCX
        </button>
      </div>
    </div>
  )
}

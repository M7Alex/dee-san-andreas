export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { readDb, updateDb } from '@/lib/github-db'
import { BagDraft } from '@/types'

async function getSession(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

// ─── GET — liste les documents accessibles ───────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const role = session.role
  if (role === 'company') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { db } = await readDb()
  const docs = db.documents || []

  // superadmin/admin voient tout, consultant ne voit que les siens
  const visible =
    role === 'superadmin' || role === 'admin'
      ? docs
      : docs.filter((d) => d.ownerId === session.userId)

  return NextResponse.json(visible.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
}

// ─── POST — créer un nouveau document ────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (session.role === 'company') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await req.json()
  const { db } = await readDb()

  // Récupérer le username depuis la DB
  const user = db.admins.find((a) => a.id === session.userId)
  const ownerLabel = user?.username || session.userId

  const now = new Date().toISOString()
  const doc: BagDraft = {
    id: crypto.randomUUID(),
    ownerId: session.userId,
    ownerLabel,
    title: body.title || 'Nouveau B.A.G.',
    templateType: 'bag',
    status: 'draft',
    content: body.content || emptyBagContent(),
    createdAt: now,
    updatedAt: now,
  }

  await updateDb((db) => {
    if (!db.documents) db.documents = []
    db.documents.push(doc)
    return db
  })

  return NextResponse.json({ doc }, { status: 201 })
}

// ─── PATCH — modifier un document ────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json()
  const { docId, title, content, status } = body
  if (!docId) return NextResponse.json({ error: 'docId requis' }, { status: 400 })

  const { db } = await readDb()
  const doc = (db.documents || []).find((d) => d.id === docId)
  if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  // Seul le propriétaire ou un admin/superadmin peut modifier
  const isOwner = doc.ownerId === session.userId
  const isStaff = session.role === 'superadmin' || session.role === 'admin'
  if (!isOwner && !isStaff) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  await updateDb((db) => {
    db.documents = (db.documents || []).map((d) => {
      if (d.id !== docId) return d
      return {
        ...d,
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(status !== undefined ? { status } : {}),
        updatedAt: new Date().toISOString(),
      }
    })
    return db
  })

  return NextResponse.json({ ok: true })
}

// ─── DELETE — supprimer un document ──────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { docId } = await req.json()
  if (!docId) return NextResponse.json({ error: 'docId requis' }, { status: 400 })

  const { db } = await readDb()
  const doc = (db.documents || []).find((d) => d.id === docId)
  if (!doc) return NextResponse.json({ error: 'Document introuvable' }, { status: 404 })

  const isOwner = doc.ownerId === session.userId
  const isStaff = session.role === 'superadmin' || session.role === 'admin'
  if (!isOwner && !isStaff) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  await updateDb((db) => {
    db.documents = (db.documents || []).filter((d) => d.id !== docId)
    return db
  })

  return NextResponse.json({ ok: true })
}

// ─── Template vide ────────────────────────────────────────────────────────────
function emptyBagContent() {
  return {
    entreprise: '', secteur: '', refDossier: '', controleur: '', dateAudit: '',
    periodeControlee: '3 dernières semaines', typeControle: '' as const,
    etatFinancier: '' as const,
    identiteGestionnaire: '', datePriseFonction: '', contextAudit: '',
    evaluationCooperation: '' as const, observationsComportementales: '',
    effectifActuel: '', stabiliteEquipes: '' as const, postesVacants: '',
    horaires: '', maitiseStocks: '' as const, fluxClientele: '' as const,
    modeleEconomique: '' as const, dependanceExterne: '' as const,
    difficulte1: '', difficulte2: '', difficulte3: '',
    tresorerieDeclaree: '', tresorerieReelle: '', soldeApresFrais: '', impotDu: '',
    semaine1: { declaration: false, paiement: false, justificatifs: false, anomalie: '' },
    semaine2: { declaration: false, paiement: false, justificatifs: false, anomalie: '' },
    semaine3: { declaration: false, paiement: false, justificatifs: false, anomalie: '' },
    qualificationCas: '' as const, detailAnomalies: '',
    conclusionViabilite: '',
    mesureRedressement: false, montantRedressement: '',
    mesureAmende: false, montantAmende: '',
    mesureExoneration: false, dureeExoneration: '', motifExoneration: '',
    mesureSubvFonctionnement: false, montantSubvFonct: '',
    mesureSubvUrgence: false, montantSubvUrgence: '',
    mesureAideRH: false, mesureFermeture: false, motifFermeture: '',
    mesureFraude: false, mesureAutre: '',
    resumeSituation: '', subventionRecue: '', motifSubvention: '',
    lieuDate: '', nomControleur: '', validePar: '',
    source1: '', source2: '', sourceDependance: '',
    charges: [
      { poste: 'Achats stocks / matières', montant: '', frequence: 'Hebdomadaire', commentaire: '' },
      { poste: 'Salaires & primes', montant: '', frequence: 'Hebdomadaire', commentaire: '' },
      { poste: 'Charges opérationnelles', montant: '', frequence: 'Hebdomadaire', commentaire: '' },
      { poste: 'Impôts & taxes', montant: '', frequence: 'Hebdomadaire', commentaire: '' },
    ],
    amendes: [
      { type: 'Retard déclaration', bareme: '', montant: '', justification: '' },
    ],
    subventions: [
      { type: 'Fonctionnement', demandee: false, montant: '', motif: '', avis: '' as const },
      { type: 'Urgence', demandee: false, montant: '', motif: '', avis: '' as const },
    ],
    reco1: '', reco2: '', reco3: '', recoPoinPoints: '',
  }
}

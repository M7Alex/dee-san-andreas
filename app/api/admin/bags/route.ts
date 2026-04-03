export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { readDb, updateDb, addLog } from '@/lib/github-db'
import { BAGDocument } from '@/types'

// ── GET : liste les BAGs accessibles ─────────────────────────────────────────
// superadmin/admin → tous les BAGs
// consultant → seulement les siens
export async function GET(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role === 'company') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { db } = await readDb()
  const isFullAccess = session.role === 'superadmin' || session.role === 'admin'

  const bags = (db.bags ?? []).filter(b =>
    isFullAccess ? true : b.ownerId === session.userId
  ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return NextResponse.json(bags)
}

// ── POST : créer un nouveau BAG ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role === 'company') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { db } = await readDb()
  const admin = db.admins.find(a => a.id === session.userId)

  const defaultCheckboxes = Object.fromEntries(
    ['redressement','amende','exoneration','subvFonctionnement','subvUrgence','aideRH','fermeture','fraude',
     'tresOK','tresKO','coopTotale','coopPartielle','coopRefus','casSImple','casGrave','conformite',
     'stableEquipes','turnover','recrutement','stockBonne','stockMoyenne','stockInsuffisante',
     'fluxRegulier','fluxIrregulier','fluxFaible','modPassage','modContrats','modMixte',
     'depAutonome','depPartielle','depTres','ctrlRoutine','ctrlAnomalie','ctrlReprise',
     'etatStable','etatMoyen','etatMauvais',
     's3Decl','s3Paie','s3Just','s2Decl','s2Paie','s2Just','s1Decl','s1Paie','s1Just',
     'pj01','pj02','pj03','pj04','pj05','pj06','pj07','pj08','pj09','pj10'
    ].map(k => [k, false])
  )

  const now = new Date().toISOString()
  const bag: BAGDocument = {
    id: crypto.randomUUID(),
    ownerId: session.userId,
    ownerLabel: admin?.username ?? session.role,
    status: 'brouillon',
    createdAt: now,
    updatedAt: now,
    entreprise: '', secteur: '', dateAudit: '', periodeControlee: '3 dernières semaines', refDossier: '',
    cfNom: admin?.username ?? '', idGestionnaire: '', datePriseFonction: '', contexteAudit: '',
    cooperationNote: '', observationsComportement: '', effectifActuel: '', postesVacants: '',
    horaireOuverture: '', diffOp1: '', diffOp2: '', diffOp3: '',
    tresorerieDeclaree: '', tresorerieReelle: '', soldeApresFrags: '', impotDu: '', tauxRef: '', ecartTreso: '',
    s3Anomalie: '', s2Anomalie: '', s1Anomalie: '', detailAnomalie: '',
    conclusionViabilite: '', preconisationsDetail: '',
    montantRedressement: '', montantAmende: '', dureeExoneration: '', motifExoneration: '',
    montantSubvFonct: '', montantSubvUrgence: '', autrePreco: '', resumeDiscord: '',
    sourceRevenuPrincipal: '', sourceRevenuSecondaire: '', dependanceTiers: '',
    chargesStocks: '', chargesSalaires: '', chargesOp: '', chargesImpots: '', chargesAutres: '',
    recourtTerme: '', recoMoyenTerme: '', recoLongTerme: '', pointsAttention: '',
    montantAmRetardEvt: '', calcAmRetardEvt: '', montantAmRetardProd: '', calcAmRetardProd: '',
    montantAmRetard24h: '', montantAmRetard48h: '', montantAmRetard72h: '',
    montantAmDocManquant: '', montantAmDeductNonJust: '', totalAmendes: '',
    montantSubvEvt: '', motifSubvEvt: '', montantSubvInvest: '', motifSubvInvest: '',
    montantSubvFormation: '', motifSubvFormation: '',
    pj07desc: '', pj08desc: '', pj10desc: '',
    pj01date: '', pj02date: '', pj03date: '', pj04date: '', pj05date: '',
    pj06date: '', pj07date: '', pj08date: '', pj09date: '', pj10date: '',
    dateFait: '', nomCF: admin?.username ?? '', nomDOF: '',
    checkboxes: defaultCheckboxes as BAGDocument['checkboxes'],
  }

  await updateDb(db => { db.bags.push(bag); return db })
  addLog({ userId: session.userId, userLabel: admin?.username ?? session.role, action: 'BAG_CREATED', details: `Nouveau BAG créé` }).catch(() => {})

  return NextResponse.json({ ok: true, bag })
}

// ── PUT : mettre à jour un BAG ────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role === 'company') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const body = await req.json() as Partial<BAGDocument> & { id: string }
  if (!body.id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const { db } = await readDb()
  const isFullAccess = session.role === 'superadmin' || session.role === 'admin'
  const idx = db.bags.findIndex(b => b.id === body.id && (isFullAccess || b.ownerId === session.userId))
  if (idx === -1) return NextResponse.json({ error: 'BAG introuvable ou accès refusé' }, { status: 404 })

  await updateDb(db => {
    db.bags[idx] = { ...db.bags[idx], ...body, updatedAt: new Date().toISOString() }
    return db
  })

  return NextResponse.json({ ok: true })
}

// ── DELETE : supprimer un BAG ─────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role === 'company') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const { db } = await readDb()
  const isFullAccess = session.role === 'superadmin' || session.role === 'admin'
  const bag = db.bags.find(b => b.id === id && (isFullAccess || b.ownerId === session.userId))
  if (!bag) return NextResponse.json({ error: 'BAG introuvable' }, { status: 404 })

  await updateDb(db => { db.bags = db.bags.filter(b => b.id !== id); return db })
  addLog({ userId: session.userId, userLabel: session.role, action: 'BAG_DELETED', details: `BAG ${bag.entreprise} supprimé` }).catch(() => {})

  return NextResponse.json({ ok: true })
}

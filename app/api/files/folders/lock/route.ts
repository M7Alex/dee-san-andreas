export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME, hashPin, verifyPin } from '@/lib/auth'
import { readDb, updateDb, addLog } from '@/lib/github-db'

// POST : verrouiller un dossier (admin/superadmin only)
// body: { folderId, pin }  → lock
// body: { folderId, pin, unlock: true } → unlock
export async function POST(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  // Seuls admin et superadmin peuvent verrouiller
  if (session.role !== 'superadmin' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé aux admins' }, { status: 403 })
  }

  const { folderId, pin, unlock } = await req.json()
  if (!folderId || !pin) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'Le code doit être 4 chiffres' }, { status: 400 })
  }

  const { db } = await readDb()
  const folder = (db.folders ?? []).find(f => f.id === folderId)
  if (!folder) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })

  if (unlock) {
    // Déverrouiller — vérifier le PIN actuel
    if (!folder.lockPin) {
      return NextResponse.json({ error: 'Ce dossier n\'est pas verrouillé' }, { status: 400 })
    }
    const valid = await verifyPin(pin, folder.lockPin)
    if (!valid) return NextResponse.json({ error: 'Code incorrect' }, { status: 401 })

    await updateDb(db => {
      const f = (db.folders ?? []).find(f => f.id === folderId)
      if (f) { delete f.lockPin; delete f.lockedBy }
      return db
    })
    await addLog({
      userId: session.userId, userLabel: session.role,
      action: 'FOLDER_UNLOCKED',
      companyId: folder.companyId,
      details: `Dossier déverrouillé : "${folder.name}"`,
    }).catch(() => {})
    return NextResponse.json({ ok: true, locked: false })
  } else {
    // Verrouiller
    const pinHash = await hashPin(pin)
    await updateDb(db => {
      const f = (db.folders ?? []).find(f => f.id === folderId)
      if (f) { f.lockPin = pinHash; f.lockedBy = session.userId }
      return db
    })
    await addLog({
      userId: session.userId, userLabel: session.role,
      action: 'FOLDER_LOCKED',
      companyId: folder.companyId,
      details: `Dossier verrouillé : "${folder.name}"`,
    }).catch(() => {})
    return NextResponse.json({ ok: true, locked: true })
  }
}

// GET : vérifier le PIN d'un dossier verrouillé (pour y accéder)
// query: folderId, pin
export async function GET(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const folderId = searchParams.get('folderId')
  const pin = searchParams.get('pin')

  if (!folderId || !pin) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  const { db } = await readDb()
  const folder = (db.folders ?? []).find(f => f.id === folderId)
  if (!folder) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 })
  if (!folder.lockPin) return NextResponse.json({ ok: true }) // pas verrouillé

  const valid = await verifyPin(pin, folder.lockPin)
  if (!valid) return NextResponse.json({ error: 'Code incorrect' }, { status: 401 })
  return NextResponse.json({ ok: true })
}

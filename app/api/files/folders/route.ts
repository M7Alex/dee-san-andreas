export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { readDb, updateDb, addLog } from '@/lib/github-db'
import { CustomFolder } from '@/types'

// ── GET : liste les dossiers d'une entreprise ─────────────────────────────────
export async function GET(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  const companyId = new URL(req.url).searchParams.get('companyId')
  if (!companyId) return NextResponse.json({ error: 'companyId manquant' }, { status: 400 })

  const { db } = await readDb()
  const folders = (db.folders ?? []).filter(f => f.companyId === companyId)
  return NextResponse.json(folders)
}

// ── POST : créer un dossier (ou sous-dossier) ─────────────────────────────────
export async function POST(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  // Seuls les staff peuvent créer des dossiers
  if (session.role === 'company') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { name, companyId, parentId } = await req.json()

  if (!name?.trim() || !companyId) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }
  if (name.trim().length > 50) {
    return NextResponse.json({ error: 'Nom trop long (max 50 car.)' }, { status: 400 })
  }

  const { db } = await readDb()

  // Vérifier doublon au même niveau
  const duplicate = (db.folders ?? []).find(
    f =>
      f.companyId === companyId &&
      f.name.toLowerCase() === name.trim().toLowerCase() &&
      (f.parentId ?? null) === (parentId ?? null)
  )
  if (duplicate) {
    return NextResponse.json({ error: 'Un dossier avec ce nom existe déjà ici' }, { status: 409 })
  }

  const folder: CustomFolder = {
    id: crypto.randomUUID(),
    name: name.trim(),
    companyId,
    ...(parentId ? { parentId } : {}),
    createdAt: new Date().toISOString(),
    createdBy: session.userId,
  }

  await updateDb(db => {
    if (!db.folders) db.folders = []
    db.folders.push(folder)
    return db
  })

  await addLog({
    userId: session.userId,
    userLabel: session.role,
    action: 'FOLDER_CREATED',
    companyId,
    details: `Dossier créé : "${folder.name}"`,
  }).catch(() => {})

  return NextResponse.json({ ok: true, folder })
}

// ── PATCH : renommer un dossier ───────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  if (session.role === 'company') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { folderId, name } = await req.json()
  if (!folderId || !name?.trim()) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  await updateDb(db => {
    const folder = (db.folders ?? []).find(f => f.id === folderId)
    if (folder) {
      const oldName = folder.name
      const newName = name.trim()
      // Mettre à jour les fichiers qui référencent cet ancien nom
      db.files = db.files.map(file =>
        file.folder === oldName && file.companyId === folder.companyId
          ? { ...file, folder: newName, updatedAt: new Date().toISOString() }
          : file
      )
      folder.name = newName
    }
    return db
  })

  await addLog({
    userId: session.userId,
    userLabel: session.role,
    action: 'FOLDER_RENAMED',
    details: `Dossier renommé → "${name.trim()}"`,
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}

// ── DELETE : supprimer un dossier ─────────────────────────────────────────────
// Les fichiers sont déplacés vers le dossier parent ou "Général"
// Les sous-dossiers sont supprimés en cascade
export async function DELETE(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  if (session.role === 'company') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { folderId } = await req.json()
  if (!folderId) return NextResponse.json({ error: 'folderId manquant' }, { status: 400 })

  await updateDb(db => {
    const folder = (db.folders ?? []).find(f => f.id === folderId)
    if (!folder) return db

    // Collecter tous les IDs à supprimer (récursif)
    const toDelete = new Set<string>()
    const collect = (id: string) => {
      toDelete.add(id)
      ;(db.folders ?? [])
        .filter(f => f.parentId === id)
        .forEach(child => collect(child.id))
    }
    collect(folderId)

    // Trouver le nom du dossier parent pour y déplacer les fichiers
    const parentFolder = folder.parentId
      ? (db.folders ?? []).find(f => f.id === folder.parentId)
      : null
    const fallbackFolder = parentFolder ? parentFolder.name : 'Général'

    // Déplacer les fichiers de TOUS les dossiers supprimés vers le fallback
    const deletedNames = new Set(
      [...toDelete].map(id => (db.folders ?? []).find(f => f.id === id)?.name).filter(Boolean)
    )
    db.files = db.files.map(file =>
      deletedNames.has(file.folder) && file.companyId === folder.companyId
        ? { ...file, folder: fallbackFolder, updatedAt: new Date().toISOString() }
        : file
    )

    db.folders = (db.folders ?? []).filter(f => !toDelete.has(f.id))
    return db
  })

  await addLog({
    userId: session.userId,
    userLabel: session.role,
    action: 'FOLDER_DELETED',
    details: `Dossier supprimé (id: ${folderId})`,
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}

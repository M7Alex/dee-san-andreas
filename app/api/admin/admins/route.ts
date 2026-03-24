import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME, hashPassword } from '@/lib/auth'
import { readDb, updateDb, addLog } from '@/lib/github-db'
import { AdminUser, DEFAULT_PERMISSIONS, Permissions, UserRole } from '@/types'

export const dynamic = 'force-dynamic'

// GET : liste admins et consultants
export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role === 'company' || session.role === 'consultant') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }
  const { db } = await readDb()
  const list = db.admins.map(a => ({
    id: a.id,
    username: a.username,
    role: a.role,
    permissions: a.permissions ?? DEFAULT_PERMISSIONS[a.role],
    createdAt: a.createdAt,
    lastLogin: a.lastLogin,
    createdBy: a.createdBy,
  }))
  return NextResponse.json(list)
}

// POST : créer admin ou consultant
export async function POST(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  const { username, password, role, permissions } = await req.json()

  // Seul superadmin peut créer des admins, admin peut créer des consultants
  if (role === 'admin' && session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Seul le superadmin peut créer des admins' }, { status: 403 })
  }
  if (role === 'consultant' && session.role !== 'superadmin' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }
  if (role === 'superadmin') {
    return NextResponse.json({ error: 'Impossible de créer un superadmin' }, { status: 403 })
  }

  if (!username || !password || !role) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const { db } = await readDb()
  if (db.admins.find(a => a.username === username)) {
    return NextResponse.json({ error: 'Ce nom d\'utilisateur existe déjà' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  const newUser: AdminUser = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
    role: role as UserRole,
    permissions: permissions ?? DEFAULT_PERMISSIONS[role as UserRole],
    createdAt: new Date().toISOString(),
    createdBy: session.userId,
  }

  await updateDb((db) => {
    db.admins.push(newUser)
    return db
  })

  await addLog({
    userId: session.userId,
    userLabel: session.role,
    action: role === 'consultant' ? 'CONSULTANT_CREATED' : 'ADMIN_CREATED',
    details: `Création de ${role} "${username}"`,
  })

  return NextResponse.json({ ok: true, user: { id: newUser.id, username, role } })
}

// PATCH : mettre à jour les permissions
export async function PATCH(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role === 'company' || session.role === 'consultant') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { userId, permissions } = await req.json()
  if (!userId || !permissions) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  const { db } = await readDb()
  const target = db.admins.find(a => a.id === userId)
  if (!target) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  // Admin ne peut modifier que les consultants
  if (session.role === 'admin' && target.role !== 'consultant') {
    return NextResponse.json({ error: 'Un admin ne peut modifier que les consultants' }, { status: 403 })
  }
  // Personne ne peut modifier le superadmin
  if (target.role === 'superadmin') {
    return NextResponse.json({ error: 'Impossible de modifier le superadmin' }, { status: 403 })
  }

  await updateDb((db) => {
    const user = db.admins.find(a => a.id === userId)
    if (user) user.permissions = permissions as Permissions
    return db
  })

  await addLog({
    userId: session.userId,
    userLabel: session.role,
    action: 'PERMISSIONS_UPDATED',
    details: `Permissions mises à jour pour "${target.username}"`,
  })

  return NextResponse.json({ ok: true })
}

// DELETE : supprimer un admin ou consultant
export async function DELETE(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  const { userId } = await req.json()
  const { db } = await readDb()
  const target = db.admins.find(a => a.id === userId)
  if (!target) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  if (target.role === 'superadmin') {
    return NextResponse.json({ error: 'Impossible de supprimer le superadmin' }, { status: 403 })
  }
  if (target.role === 'admin' && session.role !== 'superadmin') {
    return NextResponse.json({ error: 'Seul le superadmin peut supprimer un admin' }, { status: 403 })
  }

  await updateDb((db) => {
    db.admins = db.admins.filter(a => a.id !== userId)
    return db
  })

  await addLog({
    userId: session.userId,
    userLabel: session.role,
    action: 'USER_DELETED',
    details: `Suppression de ${target.role} "${target.username}"`,
  })

  return NextResponse.json({ ok: true })
}

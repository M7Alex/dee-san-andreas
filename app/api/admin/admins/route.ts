import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME, hashPassword } from '@/lib/auth'
import { readDb, updateDb, addLog } from '@/lib/github-db'
import { AdminUser, DEFAULT_PERMISSIONS, AdminPermissions, UserRole } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { db } = await readDb()
  return NextResponse.json(db.admins.map(a => ({
    id: a.id,
    username: a.username,
    role: a.role,
    permissions: a.permissions || DEFAULT_PERMISSIONS[a.role],
    createdAt: a.createdAt,
    lastLogin: a.lastLogin,
  })))
}

export async function POST(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { username, password, role, permissions } = await req.json()
  if (!username || !password) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  const validRole: UserRole = ['superadmin', 'admin', 'consultant'].includes(role) ? role : 'admin'

  const { db } = await readDb()
  if (db.admins.find(a => a.username === username)) {
    return NextResponse.json({ error: 'Identifiant déjà utilisé' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  const newAdmin: AdminUser = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
    role: validRole,
    permissions: permissions || DEFAULT_PERMISSIONS[validRole],
    createdAt: new Date().toISOString(),
  }

  await updateDb((db) => { db.admins.push(newAdmin); return db })
  await addLog({ userId: session.userId, userLabel: session.role, action: 'ADMIN_CREATED', details: `Création de ${username} (${validRole})` })

  return NextResponse.json({ ok: true, admin: { id: newAdmin.id, username: newAdmin.username, role: newAdmin.role, permissions: newAdmin.permissions } })
}

export async function DELETE(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { adminId } = await req.json()
  if (adminId === session.userId) return NextResponse.json({ error: 'Impossible de supprimer son propre compte' }, { status: 400 })

  await updateDb((db) => { db.admins = db.admins.filter(a => a.id !== adminId); return db })
  await addLog({ userId: session.userId, userLabel: session.role, action: 'ADMIN_DELETED' })
  return NextResponse.json({ ok: true })
}

// PATCH : mettre à jour les permissions d'un admin
export async function PATCH(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { adminId, permissions } = await req.json()

  await updateDb((db) => {
    const admin = db.admins.find(a => a.id === adminId)
    if (admin) admin.permissions = permissions
    return db
  })

  await addLog({ userId: session.userId, userLabel: session.role, action: 'PERMISSIONS_UPDATED', details: `Permissions modifiées pour admin ${adminId}` })
  return NextResponse.json({ ok: true })
}

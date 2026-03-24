export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME, hashPassword } from '@/lib/auth'
import { readDb, updateDb } from '@/lib/github-db'
import { AdminUser, DEFAULT_PERMISSIONS, Permissions, UserRole } from '@/types'

function getSession() {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

// GET : liste admins + consultants
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (session.role === 'company' || session.role === 'consultant') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }
  const { db } = await readDb()
  return NextResponse.json(
    db.admins.map(a => ({
      id: a.id, username: a.username, role: a.role,
      permissions: a.permissions ?? DEFAULT_PERMISSIONS[a.role],
      createdAt: a.createdAt, lastLogin: a.lastLogin, createdBy: a.createdBy,
    }))
  )
}

// POST : créer admin ou consultant
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { username, password, role } = await req.json()
  if (!username || !password || !role) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  if (role === 'superadmin') return NextResponse.json({ error: 'Impossible de créer un superadmin' }, { status: 403 })
  if (role === 'admin' && session.role !== 'superadmin') return NextResponse.json({ error: 'Seul le superadmin peut créer des admins' }, { status: 403 })
  if (role === 'consultant' && session.role !== 'superadmin' && session.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { db } = await readDb()
  if (db.admins.find(a => a.username === username)) return NextResponse.json({ error: 'Identifiant déjà utilisé' }, { status: 409 })

  const newUser: AdminUser = {
    id: crypto.randomUUID(),
    username,
    passwordHash: await hashPassword(password),
    role: role as UserRole,
    permissions: DEFAULT_PERMISSIONS[role as UserRole],
    createdAt: new Date().toISOString(),
    createdBy: session.userId,
  }

  await updateDb(db => { db.admins.push(newUser); return db })
  return NextResponse.json({ ok: true, user: { id: newUser.id, username, role } })
}

// PATCH : modifier les permissions
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (session.role === 'company' || session.role === 'consultant') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { userId, permissions } = await req.json()
  const { db } = await readDb()
  const target = db.admins.find(a => a.id === userId)
  if (!target) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  if (target.role === 'superadmin') return NextResponse.json({ error: 'Impossible de modifier le superadmin' }, { status: 403 })
  if (session.role === 'admin' && target.role !== 'consultant') return NextResponse.json({ error: 'Un admin ne peut modifier que les consultants' }, { status: 403 })

  await updateDb(db => {
    const u = db.admins.find(a => a.id === userId)
    if (u) u.permissions = permissions as Permissions
    return db
  })
  return NextResponse.json({ ok: true })
}

// DELETE : supprimer
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { userId } = await req.json()
  const { db } = await readDb()
  const target = db.admins.find(a => a.id === userId)
  if (!target) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  if (target.role === 'superadmin') return NextResponse.json({ error: 'Impossible de supprimer le superadmin' }, { status: 403 })
  if (target.id === session.userId) return NextResponse.json({ error: 'Impossible de supprimer son propre compte' }, { status: 400 })
  if (target.role === 'admin' && session.role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  if (target.role === 'consultant' && session.role !== 'superadmin' && session.role !== 'admin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  await updateDb(db => { db.admins = db.admins.filter(a => a.id !== userId); return db })
  return NextResponse.json({ ok: true })
}

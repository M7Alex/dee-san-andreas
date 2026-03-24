import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME, hashPassword } from '@/lib/auth'
import { readDb, updateDb } from '@/lib/github-db'
import { AdminUser } from '@/types'

export const dynamic = 'force-dynamic'

// GET : liste tous les admins (superadmin seulement)
export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { db } = await readDb()
  const admins = db.admins.map(a => ({
    id: a.id,
    username: a.username,
    role: a.role,
    createdAt: a.createdAt,
    lastLogin: a.lastLogin,
  }))
  return NextResponse.json(admins)
}

// POST : créer un admin
export async function POST(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { username, password, role } = await req.json()
  if (!username || !password) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })

  const { db } = await readDb()
  if (db.admins.find(a => a.username === username)) {
    return NextResponse.json({ error: 'Identifiant déjà utilisé' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  const newAdmin: AdminUser = {
    id: crypto.randomUUID(),
    username,
    passwordHash,
    role: role === 'superadmin' ? 'superadmin' : 'admin',
    createdAt: new Date().toISOString(),
  }

  await updateDb((db) => {
    db.admins.push(newAdmin)
    return db
  })

  return NextResponse.json({ ok: true, admin: { id: newAdmin.id, username: newAdmin.username, role: newAdmin.role } })
}

// DELETE : supprimer un admin
export async function DELETE(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { adminId } = await req.json()
  if (adminId === session.userId) return NextResponse.json({ error: 'Impossible de supprimer son propre compte' }, { status: 400 })

  await updateDb((db) => {
    db.admins = db.admins.filter(a => a.id !== adminId)
    return db
  })

  return NextResponse.json({ ok: true })
}

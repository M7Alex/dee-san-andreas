export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME, verifyPassword, hashPassword } from '@/lib/auth'
import { readDb, updateDb, addLog } from '@/lib/github-db'

export async function POST(req: NextRequest) {
  try {
    const token = cookies().get(COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const session = await verifyToken(token)
    if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    // Seul le superadmin peut changer son propre mot de passe via cette route
    if (session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Réservé au superadmin' }, { status: 403 })
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Minimum 8 caractères' }, { status: 400 })
    }

    const { db } = await readDb()
    const user = db.admins.find(a => a.id === session.userId)
    if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    const valid = await verifyPassword(currentPassword, user.passwordHash)
    if (!valid) return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 401 })

    const newHash = await hashPassword(newPassword)

    await updateDb((db) => {
      const u = db.admins.find(a => a.id === session.userId)
      if (u) u.passwordHash = newHash
      return db
    })

    await addLog({
      userId: session.userId,
      userLabel: 'superadmin',
      action: 'PERMISSIONS_UPDATED',
      details: 'Mot de passe superadmin modifié',
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('change-password error:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

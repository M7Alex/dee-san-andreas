export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { readDb } from '@/lib/github-db'
import { DEFAULT_PERMISSIONS, UserRole } from '@/types'

export async function GET() {
  try {
    const token = cookies().get(COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ authenticated: false })

    const session = await verifyToken(token)
    if (!session) return NextResponse.json({ authenticated: false })

    // Pour les entreprises, pas besoin de lire la DB
    if (session.role === 'company') {
      return NextResponse.json({ authenticated: true, ...session, permissions: DEFAULT_PERMISSIONS.company })
    }

    // Pour les admins, récupérer les permissions depuis la DB
    let permissions = DEFAULT_PERMISSIONS[session.role as UserRole] ?? DEFAULT_PERMISSIONS.consultant
    try {
      const { db } = await readDb()
      const user = db.admins.find(a => a.id === session.userId)
      if (user?.permissions) {
        permissions = user.permissions
      }
    } catch {
      // Si la DB est inaccessible, utiliser les permissions par défaut du rôle
      // Le login reste fonctionnel
    }

    return NextResponse.json({ authenticated: true, ...session, permissions })
  } catch (err) {
    console.error('auth/me error:', err)
    return NextResponse.json({ authenticated: false })
  }
}

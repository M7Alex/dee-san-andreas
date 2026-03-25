import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { readDb } from '@/lib/github-db'
import { DEFAULT_PERMISSIONS, UserRole } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  const { db } = await readDb()
  const user = db.admins.find(a => a.id === session.userId)
  const permissions = user?.permissions ?? DEFAULT_PERMISSIONS[session.role as UserRole] ?? DEFAULT_PERMISSIONS.consultant

  return NextResponse.json({
    ...session,
    permissions,
  })
}

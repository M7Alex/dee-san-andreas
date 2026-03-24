export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { readDb } from '@/lib/github-db'
import { DEFAULT_PERMISSIONS, UserRole } from '@/types'

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ authenticated: false })
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ authenticated: false })

  try {
    const { db } = await readDb()
    const user = db.admins.find(a => a.id === session.userId)
    const permissions = user?.permissions ?? DEFAULT_PERMISSIONS[session.role as UserRole] ?? DEFAULT_PERMISSIONS.consultant
    return NextResponse.json({ authenticated: true, session, permissions })
  } catch {
    return NextResponse.json({ authenticated: true, session, permissions: DEFAULT_PERMISSIONS[session.role as UserRole] })
  }
}

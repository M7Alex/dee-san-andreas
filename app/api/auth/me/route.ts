export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { readDb } from '@/lib/github-db'
import { DEFAULT_PERMISSIONS } from '@/types'

export async function GET(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ authenticated: false })
  
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ authenticated: false })

  // Récupérer les permissions réelles depuis la DB
  if (session.role !== 'company') {
    try {
      const { db } = await readDb()
      const admin = db.admins.find(a => a.id === session.userId)
      if (admin) {
        session.permissions = admin.permissions || DEFAULT_PERMISSIONS[admin.role]
      }
    } catch {}
  }
  
  return NextResponse.json({ authenticated: true, session })
}

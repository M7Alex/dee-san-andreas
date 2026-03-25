export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { getFilesByCompany } from '@/lib/github-db'

export async function GET(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  if (!companyId) return NextResponse.json({ error: 'companyId manquant' }, { status: 400 })

  // Company users can only see their own files
  if (session.role === 'company' && session.companyId !== companyId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const files = await getFilesByCompany(companyId)
  const sorted = [...files].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return b.uploadedAt.localeCompare(a.uploadedAt)
  })
  return NextResponse.json(sorted)
}

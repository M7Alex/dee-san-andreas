import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { readDb } from '@/lib/github-db'

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role === 'company') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { db } = await readDb()
  
  const stats = {
    totalFiles: db.files.length,
    totalCompanies: db.companies.filter((c) => c.active).length,
    totalAdmins: db.admins.length,
    recentLogs: db.logs.slice(0, 10),
    filesByCategory: {} as Record<string, number>,
    recentFiles: [...db.files]
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
      .slice(0, 8),
  }

  return NextResponse.json(stats)
}

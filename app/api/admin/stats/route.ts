export const dynamic = "force-dynamic"

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
  const now = Date.now()
  const DAY = 86400000

  // Calcul du score de santé par entreprise (admin-only, jamais exposé aux entreprises)
  const companyScores = db.companies.filter(c => c.active).map(company => {
    const files = db.files.filter(f => f.companyId === company.id)
    const logs = db.logs.filter(l => l.companyId === company.id)

    // Score basé sur : activité récente, volume fichiers, connexions
    const filesLast7d = files.filter(f => now - new Date(f.uploadedAt).getTime() < 7 * DAY).length
    const filesLast30d = files.filter(f => now - new Date(f.uploadedAt).getTime() < 30 * DAY).length
    const connexionsLast7d = logs.filter(l => l.action === 'COMPANY_ACCESS' && now - new Date(l.timestamp).getTime() < 7 * DAY).length
    const lastActivity = logs.length > 0 ? Math.max(...logs.map(l => new Date(l.timestamp).getTime())) : 0
    const daysSinceActivity = lastActivity > 0 ? Math.floor((now - lastActivity) / DAY) : 999

    // Calcul score (0-100)
    let score = 50 // base
    score += Math.min(filesLast7d * 8, 20)   // +8 par fichier récent, max 20
    score += Math.min(filesLast30d * 3, 15)  // +3 par fichier du mois, max 15
    score += Math.min(connexionsLast7d * 5, 20) // +5 par connexion semaine, max 20
    score -= Math.min(daysSinceActivity * 2, 40) // -2 par jour d'inactivité, max -40
    score = Math.max(0, Math.min(100, Math.round(score)))

    const status = score >= 70 ? 'actif' : score >= 40 ? 'modere' : 'inactif'

    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      category: company.category,
      accentColor: company.accentColor,
      score,
      status,
      totalFiles: files.length,
      filesLast7d,
      connexionsLast7d,
      daysSinceActivity: daysSinceActivity === 999 ? null : daysSinceActivity,
      lastActivity: lastActivity > 0 ? new Date(lastActivity).toISOString() : null,
    }
  }).sort((a, b) => b.score - a.score)

  const stats = {
    totalFiles: db.files.length,
    totalCompanies: db.companies.filter(c => c.active).length,
    totalAdmins: db.admins.length,
    recentLogs: db.logs.slice(0, 10),
    recentFiles: [...db.files].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).slice(0, 8),
    companyScores,
    // Alertes automatiques
    alerts: {
      inactive: companyScores.filter(c => c.status === 'inactif').length,
      noFiles: companyScores.filter(c => c.totalFiles === 0).length,
      topActive: companyScores.slice(0, 3).map(c => c.name),
    }
  }

  return NextResponse.json(stats)
}

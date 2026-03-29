export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME, hashPin, generatePin } from '@/lib/auth'
import { readDb, updateDb, addLog } from '@/lib/github-db'
import { Company, CompanyCategory, DEFAULT_PERMISSIONS } from '@/types'

// POST : créer une nouvelle entreprise
export async function POST(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  // Seuls superadmin et admin avec canManageCompanies peuvent créer
  if (session.role !== 'superadmin' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }
  if (session.role === 'admin') {
    const { db } = await readDb()
    const user = db.admins.find(a => a.id === session.userId)
    const perms = user?.permissions ?? DEFAULT_PERMISSIONS.admin
    if (!perms.canManageCompanies) {
      return NextResponse.json({ error: 'Permission manquante : canManageCompanies' }, { status: 403 })
    }
  }

  const { name, category, color, accentColor, description, customPin } = await req.json()

  if (!name?.trim() || !category || !color || !accentColor) {
    return NextResponse.json({ error: 'Données manquantes (nom, catégorie, couleurs)' }, { status: 400 })
  }

  const validCategories: CompanyCategory[] = ['gouvernement', 'restauration', 'evenementiel', 'utilitaire', 'production']
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 })
  }

  // Générer le slug depuis le nom
  const slug = name.trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { db } = await readDb()

  // Vérifier doublon de slug
  if (db.companies.find(c => c.slug === slug)) {
    return NextResponse.json({ error: `Une entreprise avec ce nom existe déjà (slug: ${slug})` }, { status: 409 })
  }

  // PIN : custom ou généré
  const pin = customPin && /^\d{4}$/.test(customPin) ? customPin : generatePin()
  const pinHash = await hashPin(pin)

  const company: Company = {
    id: crypto.randomUUID(),
    name: name.trim(),
    slug,
    category,
    pin: pinHash,
    color,
    accentColor,
    description: description?.trim() || '',
    active: true,
    createdAt: new Date().toISOString(),
  }

  await updateDb(db => {
    db.companies.push(company)
    return db
  })

  await addLog({
    userId: session.userId,
    userLabel: session.role,
    action: 'COMPANY_CREATED',
    companyId: company.id,
    companyName: company.name,
    details: `Entreprise créée : "${company.name}" (${category})`,
  }).catch(() => {})

  return NextResponse.json({ ok: true, company: { ...company, pin }, pinHash: undefined })
}

// PATCH : activer/désactiver une entreprise
export async function PATCH(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || (session.role !== 'superadmin' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { companyId, active } = await req.json()
  if (!companyId || active === undefined) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  await updateDb(db => {
    const c = db.companies.find(c => c.id === companyId)
    if (c) c.active = active
    return db
  })

  return NextResponse.json({ ok: true })
}

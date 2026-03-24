import { NextRequest, NextResponse } from 'next/server'
import { readDb, updateDb } from '@/lib/github-db'
import { hashPassword, generatePin, hashPin } from '@/lib/auth'
import { COMPANIES } from '@/lib/companies-data'
import { Company, AdminUser, DEFAULT_PERMISSIONS } from '@/types'

export async function POST(req: NextRequest) {
  const { setupToken } = await req.json()
  if (setupToken !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 403 })
  }

  const { db } = await readDb()
  if (db.admins.length > 0) {
    return NextResponse.json({ error: 'Base de données déjà initialisée' }, { status: 400 })
  }

  const superadminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'ChangeMePlease123!'
  const passwordHash = await hashPassword(superadminPassword)
  
  const superadmin: AdminUser = {
    id: crypto.randomUUID(),
    username: 'superadmin',
    passwordHash,
    role: 'superadmin',
    permissions: DEFAULT_PERMISSIONS.superadmin,
    createdAt: new Date().toISOString(),
  }
  db.admins.push(superadmin)

  const companyPins: { name: string; slug: string; pin: string }[] = []

  for (const template of COMPANIES) {
    const pin = generatePin()
    const hashedPin = await hashPin(pin)
    companyPins.push({ name: template.name, slug: template.slug, pin })

    const company: Company = {
      id: crypto.randomUUID(),
      name: template.name,
      slug: template.slug,
      category: template.category,
      pin: hashedPin,
      color: template.color,
      accentColor: template.accentColor,
      description: template.description || '',
      active: true,
      createdAt: new Date().toISOString(),
    }
    db.companies.push(company)
  }

  await updateDb(() => db)

  return NextResponse.json({
    ok: true,
    message: 'Base de données initialisée',
    superadmin: { username: 'superadmin', password: superadminPassword },
    companies: companyPins,
  })
}

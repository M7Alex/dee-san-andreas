export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { readDb } from '@/lib/github-db'

// Retourne toutes les entreprises actives avec leurs infos complètes
export async function GET() {
  const { db } = await readDb()
  const companies = db.companies
    .filter(c => c.active)
    .map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      category: c.category,
      color: c.color,
      accentColor: c.accentColor,
      description: c.description ?? '',
      active: c.active,
      createdAt: c.createdAt,
    }))
  return NextResponse.json(companies)
}

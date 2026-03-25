import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME, generatePin, hashPin } from '@/lib/auth'
import { readDb, updateDb, addLog } from '@/lib/github-db'

export const dynamic = 'force-dynamic'

// GET : liste toutes les entreprises avec leurs PINs (visibles après régénération)
export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || (session.role !== 'superadmin' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { db } = await readDb()
  const pins = db.companies.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    category: c.category,
    active: c.active,
  }))
  return NextResponse.json(pins)
}

// POST : régénérer un PIN et le retourner en clair
export async function POST(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || (session.role !== 'superadmin' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { companyId, customPin } = await req.json()
  
  // Soit on génère un PIN aléatoire, soit on utilise celui fourni
  const newPin = customPin && /^\d{4}$/.test(customPin) ? customPin : generatePin()
  const hashedPin = await hashPin(newPin)

  let companyName = ''
  await updateDb((db) => {
    const company = db.companies.find(c => c.id === companyId)
    if (!company) throw new Error('Entreprise introuvable')
    company.pin = hashedPin
    companyName = company.name
    return db
  })

  await addLog({
    userId: session.userId,
    userLabel: session.role,
    action: 'PIN_REGENERATED',
    companyId,
    companyName,
    details: `Nouveau PIN défini par ${session.role}`,
  })

  return NextResponse.json({ ok: true, pin: newPin, companyName })
}

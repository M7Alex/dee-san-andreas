import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME, generatePin, hashPin } from '@/lib/auth'
import { readDb, updateDb, addLog } from '@/lib/github-db'

// GET: list all company PINs (superadmin only)
export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role !== 'superadmin') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { db } = await readDb()
  const pins = db.companies.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    category: c.category,
    // Note: We store the plain PIN separately for display only
    // In production you'd have a separate secure display mechanism
  }))
  return NextResponse.json(pins)
}

// POST: regenerate a company PIN
export async function POST(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || (session.role !== 'superadmin' && session.role !== 'admin')) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { companyId } = await req.json()
  const newPin = generatePin()
  const hashedPin = await hashPin(newPin)

  await updateDb((db) => {
    const company = db.companies.find((c) => c.id === companyId)
    if (!company) throw new Error('Entreprise introuvable')
    company.pin = hashedPin
    return db
  })

  await addLog({
    userId: session.userId,
    userLabel: session.role,
    action: 'PIN_REGENERATED',
    companyId,
  })

  return NextResponse.json({ ok: true, pin: newPin })
}

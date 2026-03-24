export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME, generatePin, hashPin } from '@/lib/auth'
import { readDb, updateDb, addLog } from '@/lib/github-db'

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role === 'company' || session.role === 'consultant') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const { db } = await readDb()
  return NextResponse.json(db.companies.map(c => ({ id:c.id, name:c.name, slug:c.slug, category:c.category, active:c.active })))
}

export async function POST(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role === 'company' || session.role === 'consultant') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const { companyId, customPin } = await req.json()
  const newPin = customPin && /^\d{4}$/.test(customPin) ? customPin : generatePin()
  const hashedPin = await hashPin(newPin)
  let companyName = ''
  await updateDb((db) => {
    const company = db.companies.find(c => c.id === companyId)
    if (!company) throw new Error('Entreprise introuvable')
    company.pin = hashedPin; companyName = company.name
    return db
  })
  addLog({ userId:session.userId, userLabel:session.role, action:'PIN_REGENERATED', companyId, companyName }).catch(()=>{})
  return NextResponse.json({ ok:true, pin:newPin, companyName })
}

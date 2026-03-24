export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { readDb, addLog } from '@/lib/github-db'
import { verifyPin, createToken, checkRateLimit, recordFailedAttempt, resetAttempts, sessionCookieOptions, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const rl = checkRateLimit(ip)
  if (!rl.allowed) return NextResponse.json({ error: `Trop de tentatives. Réessayez dans ${rl.retryAfter}s.` }, { status: 429 })
  const { slug, pin } = await req.json()
  if (!slug || !pin) return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  const { db } = await readDb()
  const company = db.companies.find(c => c.slug === slug)
  if (!company || !company.active) return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 })
  const valid = await verifyPin(pin, company.pin)
  if (!valid) {
    recordFailedAttempt(ip)
    addLog({ userId:company.id, userLabel:company.name, action:'LOGIN_FAILED', companyId:company.id, companyName:company.name, details:'PIN incorrect', ip }).catch(()=>{})
    return NextResponse.json({ error: 'PIN incorrect' }, { status: 401 })
  }
  resetAttempts(ip)
  addLog({ userId:company.id, userLabel:company.name, action:'COMPANY_ACCESS', companyId:company.id, companyName:company.name, ip }).catch(()=>{})
  const token = await createToken({ userId:company.id, role:'company', companyId:company.id, companySlug:company.slug })
  const res = NextResponse.json({ ok:true, company:{ id:company.id, name:company.name, slug:company.slug } })
  res.cookies.set(COOKIE_NAME, token, sessionCookieOptions())
  return res
}

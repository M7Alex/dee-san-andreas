import { NextRequest, NextResponse } from 'next/server'
import { getAdminByUsername, addLog, updateDb } from '@/lib/github-db'
import { verifyPassword, createToken, checkRateLimit, recordFailedAttempt, resetAttempts, sessionCookieOptions, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  
  const rl = checkRateLimit(ip)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Trop de tentatives. Réessayez dans ${rl.retryAfter} secondes.` },
      { status: 429 }
    )
  }

  const { username, password } = await req.json()
  if (!username || !password) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })

  const admin = await getAdminByUsername(username)
  if (!admin) {
    recordFailedAttempt(ip)
    await addLog({ userId: 'unknown', userLabel: username, action: 'LOGIN_FAILED', details: 'Utilisateur introuvable', ip })
    return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
  }

  const valid = await verifyPassword(password, admin.passwordHash)
  if (!valid) {
    recordFailedAttempt(ip)
    await addLog({ userId: admin.id, userLabel: username, action: 'LOGIN_FAILED', details: 'Mot de passe incorrect', ip })
    return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
  }

  resetAttempts(ip)
  
  // Mettre à jour lastLogin
  await updateDb((db) => {
    const a = db.admins.find(a => a.id === admin.id)
    if (a) a.lastLogin = new Date().toISOString()
    return db
  })

  await addLog({ userId: admin.id, userLabel: username, action: 'LOGIN_SUCCESS', ip })

  const token = await createToken({ userId: admin.id, role: admin.role })
  const res = NextResponse.json({ ok: true, role: admin.role })
  res.cookies.set(COOKIE_NAME, token, sessionCookieOptions())
  return res
}

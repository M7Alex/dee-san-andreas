export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminByUsername, addLog, updateDb } from '@/lib/github-db'
import { verifyPassword, createToken, checkRateLimit, recordFailedAttempt, resetAttempts, sessionCookieOptions, COOKIE_NAME } from '@/lib/auth'
import { DEFAULT_PERMISSIONS, UserRole } from '@/types'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const rl = checkRateLimit(ip)
  if (!rl.allowed) return NextResponse.json({ error: `Trop de tentatives. Réessayez dans ${rl.retryAfter}s.` }, { status: 429 })
  try {
    const { username, password } = await req.json()
    if (!username || !password) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    const admin = await getAdminByUsername(username)
    if (!admin) {
      recordFailedAttempt(ip)
      addLog({ userId:'unknown', userLabel:username, action:'LOGIN_FAILED', details:'Utilisateur introuvable', ip }).catch(()=>{})
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }
    const valid = await verifyPassword(password, admin.passwordHash)
    if (!valid) {
      recordFailedAttempt(ip)
      addLog({ userId:admin.id, userLabel:username, action:'LOGIN_FAILED', details:'Mot de passe incorrect', ip }).catch(()=>{})
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
    }
    resetAttempts(ip)
    updateDb((db) => {
      const a = db.admins.find(a => a.id === admin.id)
      if (a) {
        a.lastLogin = new Date().toISOString()
        if (!a.permissions) a.permissions = DEFAULT_PERMISSIONS[a.role as UserRole] ?? DEFAULT_PERMISSIONS.consultant
      }
      return db
    }).catch(()=>{})
    addLog({ userId:admin.id, userLabel:username, action:'LOGIN_SUCCESS', ip }).catch(()=>{})
    const token = await createToken({ userId:admin.id, role:admin.role })
    const res = NextResponse.json({ ok:true, role:admin.role })
    res.cookies.set(COOKIE_NAME, token, sessionCookieOptions())
    return res
  } catch(err) {
    console.error('Login error:', err)
    return NextResponse.json({ error:'Erreur serveur' }, { status:500 })
  }
}

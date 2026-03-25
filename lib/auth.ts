import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { SessionData, UserRole } from '@/types'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'change-this-secret-in-production')
const COOKIE_NAME = 'dee_session'

// ─── JWT ──────────────────────────────────────────────────────────────────────

export async function createToken(data: SessionData): Promise<string> {
  return new SignJWT({ ...data })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionData
  } catch {
    return null
  }
}

export { COOKIE_NAME }

// ─── Password ─────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ─── PIN ──────────────────────────────────────────────────────────────────────

export function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

// ─── Rate limiter (in-memory, per IP) ────────────────────────────────────────

const rateLimitMap = new Map<string, { attempts: number; blockUntil?: number }>()

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip) || { attempts: 0 }

  if (entry.blockUntil && now < entry.blockUntil) {
    return { allowed: false, retryAfter: Math.ceil((entry.blockUntil - now) / 1000) }
  }

  if (entry.attempts >= 5) {
    const blockUntil = now + 30_000 // 30 seconds
    rateLimitMap.set(ip, { attempts: entry.attempts, blockUntil })
    return { allowed: false, retryAfter: 30 }
  }

  return { allowed: true }
}

export function recordFailedAttempt(ip: string): void {
  const entry = rateLimitMap.get(ip) || { attempts: 0 }
  rateLimitMap.set(ip, { ...entry, attempts: entry.attempts + 1 })
}

export function resetAttempts(ip: string): void {
  rateLimitMap.delete(ip)
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24, // 24h
    path: '/',
  }
}

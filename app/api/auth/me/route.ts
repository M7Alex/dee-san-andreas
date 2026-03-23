export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ authenticated: false })
  
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ authenticated: false })
  
  return NextResponse.json({ authenticated: true, session })
}

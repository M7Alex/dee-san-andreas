import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { updateDb } from '@/lib/github-db'

export async function PATCH(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  const { fileId, pinned } = await req.json()

  await updateDb((db) => {
    const file = db.files.find((f) => f.id === fileId)
    if (file) {
      file.pinned = pinned
      file.updatedAt = new Date().toISOString()
    }
    return db
  })

  return NextResponse.json({ ok: true })
}

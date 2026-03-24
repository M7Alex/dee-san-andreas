export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { deleteFile } from '@/lib/blob'
import { updateDb, addLog } from '@/lib/github-db'

export async function DELETE(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  const session = await verifyToken(token)
  if (!session || session.role === 'company' || session.role === 'consultant') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  const { fileId } = await req.json()
  if (!fileId) return NextResponse.json({ error: 'fileId manquant' }, { status: 400 })
  let fileName = '', companyId = ''
  await updateDb((db) => {
    const idx = db.files.findIndex(f => f.id === fileId)
    if (idx === -1) throw new Error('Fichier introuvable')
    const file = db.files[idx]
    fileName = file.name; companyId = file.companyId
    deleteFile(file.blobUrl).catch(console.error)
    db.files.splice(idx, 1)
    return db
  })
  addLog({ userId:session.userId, userLabel:session.role, action:'FILE_DELETE', companyId, fileId, fileName }).catch(()=>{})
  return NextResponse.json({ ok: true })
}

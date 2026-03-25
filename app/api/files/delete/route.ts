import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { deleteFile } from '@/lib/blob'
import { updateDb, addLog } from '@/lib/github-db'

export async function DELETE(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  const { fileId } = await req.json()
  if (!fileId) return NextResponse.json({ error: 'fileId manquant' }, { status: 400 })

  let fileName = ''
  let companyId = ''

  await updateDb((db) => {
    const idx = db.files.findIndex((f) => f.id === fileId)
    if (idx === -1) throw new Error('Fichier introuvable')
    
    const file = db.files[idx]
    
    // Company users cannot delete
    if (session.role === 'company') throw new Error('Accès refusé')
    
    fileName = file.name
    companyId = file.companyId
    
    // Delete from blob storage
    deleteFile(file.blobUrl).catch(console.error)
    
    db.files.splice(idx, 1)
    return db
  })

  await addLog({
    userId: session.userId,
    userLabel: session.role,
    action: 'FILE_DELETE',
    companyId,
    fileId,
    fileName,
  })

  return NextResponse.json({ ok: true })
}

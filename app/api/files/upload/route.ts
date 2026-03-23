github.com/M7Alex/dee-san-andreas/blob/main/app/api/files/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { uploadFile } from '@/lib/blob'
import { updateDb, addLog } from '@/lib/github-db'
import { FolderType, FileRecord } from '@/types'

export async function POST(req: NextRequest) {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  
  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const folder = formData.get('folder') as FolderType
  const companyId = formData.get('companyId') as string
  const companySlug = formData.get('companySlug') as string

  if (!file || !folder || !companyId || !companySlug) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // Company users can only upload to their own company
  if (session.role === 'company' && session.companyId !== companyId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { url } = await uploadFile(file, companySlug, folder)

  const fileRecord: FileRecord = {
    id: crypto.randomUUID(),
    companyId,
    companySlug,
    name: file.name,
    originalName: file.name,
    folder,
    mimeType: file.type,
    size: file.size,
    blobUrl: url,
    pinned: false,
    uploadedBy: session.userId,
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await updateDb((db) => {
    db.files.push(fileRecord)
    return db
  })

  await addLog({
    userId: session.userId,
    userLabel: session.role === 'company' ? companySlug : 'admin',
    action: 'FILE_UPLOAD',
    companyId,
    companyName: companySlug,
    fileId: fileRecord.id,
    fileName: file.name,
  })

  return NextResponse.json({ ok: true, file: fileRecord })
}

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { uploadFile } from '@/lib/blob'
import { updateDb, addLog, readDb } from '@/lib/github-db'
import { FolderType, FileRecord, DEFAULT_PERMISSIONS } from '@/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const token = cookies().get(COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const session = await verifyToken(token)
    if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    // Vérifier la permission d'upload
    if (session.role === 'company') {
      return NextResponse.json({ error: 'Les visiteurs entreprise ne peuvent pas uploader' }, { status: 403 })
    }

    // Vérifier les permissions personnalisées pour consultant
    if (session.role === 'consultant') {
      const { db } = await readDb()
      const user = db.admins.find(a => a.id === session.userId)
      const perms = user?.permissions ?? DEFAULT_PERMISSIONS.consultant
      if (!perms.canUploadFiles) {
        return NextResponse.json({ error: 'Permission refusée : upload non autorisé' }, { status: 403 })
      }
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as FolderType
    const companyId = formData.get('companyId') as string
    const companySlug = formData.get('companySlug') as string

    if (!file || !folder || !companyId || !companySlug) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
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
      userLabel: session.role,
      action: 'FILE_UPLOAD',
      companyId,
      companyName: companySlug,
      fileId: fileRecord.id,
      fileName: file.name,
    })

    return NextResponse.json({ ok: true, file: fileRecord })
  } catch (err: unknown) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur upload' },
      { status: 500 }
    )
  }
}

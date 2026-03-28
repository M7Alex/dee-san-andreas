import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { readDb, addLog } from '@/lib/github-db'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const blobUrl = searchParams.get('url')
  const mode = searchParams.get('mode') || 'download' // 'download' ou 'inline'

  if (!blobUrl) {
    return NextResponse.json({ error: 'URL manquante' }, { status: 400 })
  }

  // Vérifier la session
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const session = await verifyToken(token)
  if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

  // Log FILE_VIEW — trouver les infos du fichier via son URL blob
  try {
    const { db } = await readDb()
    const fileRecord = db.files.find(f => f.blobUrl === blobUrl)
    if (fileRecord) {
      const action = mode === 'inline' ? 'FILE_VIEW' : 'FILE_DOWNLOAD'
      addLog({
        userId: session.userId,
        userLabel: session.role,
        action,
        companyId: fileRecord.companyId,
        companyName: fileRecord.companySlug,
        fileId: fileRecord.id,
        fileName: fileRecord.name,
        details: `Dossier : ${fileRecord.folder}`,
      }).catch(() => {})
    }
  } catch { /* non-bloquant */ }

  try {
    // Pour un store privé, fetch avec le BLOB_READ_WRITE_TOKEN en Bearer
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    if (!blobToken) {
      return NextResponse.json({ error: 'Token blob manquant' }, { status: 500 })
    }

    const response = await fetch(blobUrl, {
      headers: {
        Authorization: `Bearer ${blobToken}`,
      },
    })

    if (!response.ok) {
      console.error(`Blob fetch failed: ${response.status} ${response.statusText}`)
      return NextResponse.json({ error: 'Fichier inaccessible' }, { status: response.status })
    }

    // Extraire le nom du fichier depuis l'URL (enlever le timestamp prefix)
    const rawName = decodeURIComponent(blobUrl.split('/').pop() || 'fichier')
    // Format: 1234567890_nom_fichier.pdf → on garde tout après le premier _
    const fileName = rawName.replace(/^\d+_/, '')

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const data = await response.arrayBuffer()

    return new Response(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${mode === 'inline' ? 'inline' : 'attachment'}; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    console.error('Download error:', err)
    return NextResponse.json({ error: 'Erreur serveur lors du téléchargement' }, { status: 500 })
  }
}

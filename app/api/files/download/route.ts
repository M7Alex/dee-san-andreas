import { get } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: Request) {
  const url = req.nextUrl.searchParams.get('url')
  const mode = req.nextUrl.searchParams.get('mode') || 'download' // 'download' ou 'inline'

  if (!url) return NextResponse.json({ error: 'URL manquante' }, { status: 400 })

  try {
    // Vérifier le cookie pour sécuriser l'accès
    const cookieStore = cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const session = await verifyToken(token)
    if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    // Récupérer le fichier depuis Vercel Blob
    const file = await get(url)
    const data = await file.arrayBuffer()

    // Header : attachment = download, inline = ouvrir dans navigateur
    return new Response(data, {
      headers: {
        'Content-Type': file.type,
        'Content-Disposition': `${mode === 'inline' ? 'inline' : 'attachment'}; filename="${file.name}"`,
      },
    })
  } catch (err) {
    console.error('Download error:', err)
    return NextResponse.json({ error: 'Erreur téléchargement' }, { status: 500 })
  }
}

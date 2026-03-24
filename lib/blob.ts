import { put, del } from '@vercel/blob'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg',
]

const MAX_SIZE = 10 * 1024 * 1024

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Type non autorisé. Formats: PDF, DOCX, XLSX, PNG, JPEG' }
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Fichier trop volumineux. Maximum: 10MB' }
  }
  return { valid: true }
}

export async function uploadFile(
  file: File,
  companySlug: string,
  folder: string
): Promise<{ url: string; pathname: string }> {
  const validation = validateFile(file)
  if (!validation.valid) throw new Error(validation.error)

  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const pathname = `companies/${companySlug}/${folder}/${timestamp}_${safeName}`

  // IMPORTANT: Vercel Blob gratuit exige access: 'public'
  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: false,
  })

  return { url: blob.url, pathname }
}

export async function deleteFile(url: string): Promise<void> {
  await del(url)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('word')) return 'docx'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'xlsx'
  if (mimeType.startsWith('image/')) return 'image'
  return 'file'
}

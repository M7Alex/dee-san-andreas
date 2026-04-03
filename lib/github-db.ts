/**
 * GitHub comme base de données
 * GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO (dee-database), GITHUB_BRANCH
 */
import { DatabaseSchema, AdminUser, Company, FileRecord, ActivityLog } from '@/types'

const GITHUB_API = 'https://api.github.com'
const OWNER = process.env.GITHUB_OWNER!
const REPO = process.env.GITHUB_REPO!
const BRANCH = process.env.GITHUB_BRANCH || 'main'
const TOKEN = process.env.GITHUB_TOKEN!
const DB_PATH = 'db/database.json'

function emptyDb(): DatabaseSchema {
  return {
    admins: [], companies: [], files: [], folders: [], logs: [], bags: [],
    meta: { version: '1.0.0', lastUpdated: new Date().toISOString() },
  }
}

let _cache: { db: DatabaseSchema; sha: string; ts: number } | null = null
const CACHE_TTL = 3000

export async function readDb(): Promise<{ db: DatabaseSchema; sha: string }> {
  const now = Date.now()
  if (_cache && now - _cache.ts < CACHE_TTL) {
    return { db: _cache.db, sha: _cache.sha }
  }

  const res = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${DB_PATH}?ref=${BRANCH}&_=${now}`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    }
  )

  if (res.status === 404) {
    const db = emptyDb()
    const sha = await writeDb(db, '')
    _cache = { db, sha, ts: Date.now() }
    return { db, sha }
  }

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
  }

  const file = await res.json()
  const content = Buffer.from(file.content, 'base64').toString('utf-8')

  let db: DatabaseSchema
  try {
    db = JSON.parse(content)
    if (!db.folders) db.folders = [] // migration
    if (!db.bags) db.bags = [] // migration BAG
  } catch {
    db = emptyDb()
  }

  _cache = { db, sha: file.sha, ts: Date.now() }
  return { db, sha: file.sha }
}

export async function writeDb(db: DatabaseSchema, sha: string): Promise<string> {
  db.meta.lastUpdated = new Date().toISOString()
  const content = Buffer.from(JSON.stringify(db, null, 2)).toString('base64')

  const body: Record<string, unknown> = {
    message: `[db] update ${new Date().toISOString()}`,
    content,
    branch: BRANCH,
  }
  if (sha) body.sha = sha

  const res = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${DB_PATH}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`GitHub write error: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  const newSha = data.content.sha
  _cache = { db, sha: newSha, ts: Date.now() }
  return newSha
}

export async function updateDb(
  updater: (db: DatabaseSchema) => DatabaseSchema | Promise<DatabaseSchema>
): Promise<void> {
  const { db, sha } = await readDb()
  const updated = await updater(db)
  await writeDb(updated, sha)
}

export async function getCompanies(): Promise<Company[]> {
  const { db } = await readDb()
  return db.companies.filter(c => c.active)
}

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  const { db } = await readDb()
  return db.companies.find(c => c.slug === slug) || null
}

export async function getFilesByCompany(companyId: string): Promise<FileRecord[]> {
  const { db } = await readDb()
  return db.files.filter(f => f.companyId === companyId)
}

export async function getAdminByUsername(username: string): Promise<AdminUser | null> {
  const { db } = await readDb()
  return db.admins.find(a => a.username === username) || null
}

export async function getLogs(limit = 100): Promise<ActivityLog[]> {
  const { db } = await readDb()
  return [...db.logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit)
}

export async function addLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
  await updateDb((db) => {
    db.logs = [
      { ...log, id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      ...db.logs
    ].slice(0, 500)
    return db
  })
}

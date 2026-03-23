/**
 * GitHub as Database Layer
 * 
 * Stores all data as JSON files in a GitHub repository.
 * Uses GitHub API to read/write with optimistic locking via SHA.
 * 
 * Required env vars:
 *   GITHUB_TOKEN         - Personal access token with repo:write
 *   GITHUB_OWNER         - GitHub username or org
 *   GITHUB_REPO          - Repository name (e.g. "dee-database")
 *   GITHUB_BRANCH        - Branch (default: "main")
 */

import { DatabaseSchema, AdminUser, Company, FileRecord, ActivityLog } from '@/types'

const GITHUB_API = 'https://api.github.com'
const OWNER = process.env.GITHUB_OWNER!
const REPO = process.env.GITHUB_REPO!
const BRANCH = process.env.GITHUB_BRANCH || 'main'
const TOKEN = process.env.GITHUB_TOKEN!

const DB_PATH = 'db/database.json'

// ─── Default empty database ───────────────────────────────────────────────────

function emptyDb(): DatabaseSchema {
  return {
    admins: [],
    companies: [],
    files: [],
    logs: [],
    meta: { version: '1.0.0', lastUpdated: new Date().toISOString() },
  }
}

// ─── Read database from GitHub ────────────────────────────────────────────────

interface GithubFile {
  content: string
  sha: string
  encoding: string
}

let _cache: { db: DatabaseSchema; sha: string; ts: number } | null = null
const CACHE_TTL = 5000 // 5 seconds

export async function readDb(): Promise<{ db: DatabaseSchema; sha: string }> {
  const now = Date.now()
  if (_cache && now - _cache.ts < CACHE_TTL) {
    return { db: _cache.db, sha: _cache.sha }
  }

  const res = await fetch(
    `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${DB_PATH}?ref=${BRANCH}`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 0 },
    }
  )

  if (res.status === 404) {
    // Initialize empty database
    const db = emptyDb()
    const sha = await writeDb(db, '')
    _cache = { db, sha, ts: Date.now() }
    return { db, sha }
  }

  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)

  const file: GithubFile = await res.json()
  const content = Buffer.from(file.content, 'base64').toString('utf-8')
  const db: DatabaseSchema = JSON.parse(content)

  _cache = { db, sha: file.sha, ts: Date.now() }
  return { db, sha: file.sha }
}

// ─── Write database to GitHub ─────────────────────────────────────────────────

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
    const err = await res.json()
    throw new Error(`GitHub write error: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  const newSha = data.content.sha

  // Invalidate cache
  _cache = { db, sha: newSha, ts: Date.now() }

  return newSha
}

// ─── Helper: atomic update ────────────────────────────────────────────────────

export async function updateDb(
  updater: (db: DatabaseSchema) => DatabaseSchema | Promise<DatabaseSchema>
): Promise<void> {
  const { db, sha } = await readDb()
  const updated = await updater(db)
  await writeDb(updated, sha)
}

// ─── Convenience getters ──────────────────────────────────────────────────────

export async function getCompanies(): Promise<Company[]> {
  const { db } = await readDb()
  return db.companies.filter((c) => c.active)
}

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  const { db } = await readDb()
  return db.companies.find((c) => c.slug === slug) || null
}

export async function getFilesByCompany(companyId: string): Promise<FileRecord[]> {
  const { db } = await readDb()
  return db.files.filter((f) => f.companyId === companyId)
}

export async function getAdminByUsername(username: string): Promise<AdminUser | null> {
  const { db } = await readDb()
  return db.admins.find((a) => a.username === username) || null
}

export async function getLogs(limit = 100): Promise<ActivityLog[]> {
  const { db } = await readDb()
  return [...db.logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit)
}

export async function addLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
  await updateDb((db) => {
    const newLog: ActivityLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }
    // Keep last 500 logs
    db.logs = [newLog, ...db.logs].slice(0, 500)
    return db
  })
}

export type UserRole = 'superadmin' | 'admin' | 'consultant' | 'company'

// ─── Système de permissions ───────────────────────────────────────────────────
export interface Permissions {
  canUploadFiles: boolean
  canDownloadFiles: boolean
  canDeleteFiles: boolean
  canPinFiles: boolean
  canViewAllCompanies: boolean
  canManageCompanies: boolean
  canManageAdmins: boolean
  canManageConsultants: boolean
  canManagePins: boolean
  canViewLogs: boolean
  canUnlockFolders: boolean
  visibleTabs: Array<'dashboard' | 'companies' | 'logs' | 'pins' | 'admins' | 'folders'>
}

export const DEFAULT_PERMISSIONS: Record<UserRole, Permissions> = {
  superadmin: {
    canUploadFiles: true,
    canDownloadFiles: true,
    canDeleteFiles: true,
    canPinFiles: true,
    canViewAllCompanies: true,
    canManageCompanies: true,
    canManageAdmins: true,
    canManageConsultants: true,
    canManagePins: true,
    canViewLogs: true,
    canUnlockFolders: true,
    visibleTabs: ['dashboard', 'companies', 'logs', 'pins', 'admins', 'folders'],
  },
  admin: {
    canUploadFiles: true,
    canDownloadFiles: true,
    canDeleteFiles: true,
    canPinFiles: true,
    canViewAllCompanies: true,
    canManageCompanies: false,
    canManageAdmins: false,
    canManageConsultants: true,
    canManagePins: false,
    canViewLogs: true,
    canUnlockFolders: true,
    visibleTabs: ['dashboard', 'companies', 'logs', 'admins'],
  },
  consultant: {
    canUploadFiles: false,
    canDownloadFiles: true,
    canDeleteFiles: false,
    canPinFiles: false,
    canViewAllCompanies: true,
    canManageCompanies: false,
    canManageAdmins: false,
    canManageConsultants: false,
    canManagePins: false,
    canViewLogs: false,
    canUnlockFolders: false,
    visibleTabs: ['dashboard', 'companies'],
  },
  company: {
    canUploadFiles: false,
    canDownloadFiles: true,
    canDeleteFiles: false,
    canPinFiles: false,
    canViewAllCompanies: false,
    canManageCompanies: false,
    canManageAdmins: false,
    canManageConsultants: false,
    canManagePins: false,
    canViewLogs: false,
    canUnlockFolders: false,
    visibleTabs: [],
  },
}

export interface AdminUser {
  id: string
  username: string
  passwordHash: string
  role: UserRole
  permissions?: Permissions
  createdAt: string
  lastLogin?: string
  createdBy?: string
}

export interface Company {
  id: string
  name: string
  slug: string
  category: CompanyCategory
  pin: string
  color: string
  accentColor: string
  description?: string
  active: boolean
  createdAt: string
}

export type CompanyCategory = 'gouvernement' | 'restauration' | 'evenementiel' | 'utilitaire' | 'production'

export type FolderType = string

export const DEFAULT_FOLDERS = ['Financier', 'RH', 'Contrats', 'Logistique', 'Stratégie'] as const

export interface CustomFolder {
  id: string
  name: string
  companyId: string
  parentId?: string
  lockPin?: string    // bcrypt hash du PIN de verrou
  lockedBy?: string   // userId qui a verrouillé
  createdAt: string
  createdBy: string
}

export interface FileRecord {
  id: string
  companyId: string
  companySlug: string
  name: string
  originalName: string
  folder: string
  mimeType: string
  size: number
  blobUrl: string
  pinned: boolean
  uploadedBy: string
  uploadedAt: string
  updatedAt: string
}

export interface ActivityLog {
  id: string
  userId: string
  userLabel: string
  action: LogAction
  companyId?: string
  companyName?: string
  fileId?: string
  fileName?: string
  details?: string
  ip?: string
  timestamp: string
}

export type LogAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'COMPANY_ACCESS'
  | 'FILE_UPLOAD'
  | 'FILE_DELETE'
  | 'FILE_PIN'
  | 'FILE_UNPIN'
  | 'PIN_REGENERATED'
  | 'ADMIN_CREATED'
  | 'CONSULTANT_CREATED'
  | 'COMPANY_CREATED'
  | 'PERMISSIONS_UPDATED'
  | 'USER_DELETED'
  | 'FOLDER_CREATED'
  | 'FOLDER_RENAMED'
  | 'FOLDER_DELETED'
  | 'FOLDER_LOCKED'
  | 'FOLDER_UNLOCKED'
  | 'FILE_VIEW'
  | 'FILE_DOWNLOAD'

export interface DatabaseSchema {
  admins: AdminUser[]
  companies: Company[]
  files: FileRecord[]
  folders: CustomFolder[]
  logs: ActivityLog[]
  meta: { version: string; lastUpdated: string }
}

export interface SessionData {
  userId: string
  role: UserRole
  companyId?: string
  companySlug?: string
}

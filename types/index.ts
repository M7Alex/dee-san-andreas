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
  visibleTabs: Array<'dashboard' | 'companies' | 'logs' | 'pins' | 'admins'>
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
    visibleTabs: ['dashboard', 'companies', 'logs', 'pins', 'admins'],
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

export type FolderType = 'Financier' | 'RH' | 'Contrats' | 'Logistique' | 'Stratégie'

export interface FileRecord {
  id: string
  companyId: string
  companySlug: string
  name: string
  originalName: string
  folder: FolderType
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

export interface DatabaseSchema {
  admins: AdminUser[]
  companies: Company[]
  files: FileRecord[]
  logs: ActivityLog[]
  meta: { version: string; lastUpdated: string }
}

export interface SessionData {
  userId: string
  role: UserRole
  companyId?: string
  companySlug?: string
}

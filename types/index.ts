export type UserRole = 'superadmin' | 'admin' | 'consultant'

export interface AdminPermissions {
  viewPins: boolean          // Voir les PINs des entreprises
  editPins: boolean          // Modifier les PINs
  uploadFiles: boolean       // Uploader des fichiers
  deleteFiles: boolean       // Supprimer des fichiers
  viewLogs: boolean          // Voir les journaux
  manageAdmins: boolean      // Gérer les admins (superadmin seulement)
  bypassCompanyAccess: boolean // Accéder à toutes les entreprises sans PIN
}

export const DEFAULT_PERMISSIONS: Record<UserRole, AdminPermissions> = {
  superadmin: {
    viewPins: true,
    editPins: true,
    uploadFiles: true,
    deleteFiles: true,
    viewLogs: true,
    manageAdmins: true,
    bypassCompanyAccess: true,
  },
  admin: {
    viewPins: true,
    editPins: true,
    uploadFiles: true,
    deleteFiles: true,
    viewLogs: true,
    manageAdmins: false,
    bypassCompanyAccess: true,
  },
  consultant: {
    viewPins: false,
    editPins: false,
    uploadFiles: true,
    deleteFiles: false,
    viewLogs: false,
    manageAdmins: false,
    bypassCompanyAccess: true,
  },
}

export const PERMISSION_LABELS: Record<keyof AdminPermissions, string> = {
  viewPins: 'Voir les PINs entreprises',
  editPins: 'Modifier les PINs',
  uploadFiles: 'Uploader des fichiers',
  deleteFiles: 'Supprimer des fichiers',
  viewLogs: 'Voir les journaux',
  manageAdmins: 'Gérer les administrateurs',
  bypassCompanyAccess: 'Accès direct aux entreprises (sans PIN)',
}

export interface AdminUser {
  id: string
  username: string
  passwordHash: string
  role: UserRole
  permissions: AdminPermissions
  createdAt: string
  lastLogin?: string
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
  | 'ADMIN_DELETED'
  | 'COMPANY_CREATED'
  | 'PERMISSIONS_UPDATED'

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
  permissions?: AdminPermissions
}

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
  canManageFolders: boolean
  canViewFolderPins: boolean
  visibleTabs: Array<'dashboard' | 'companies' | 'logs' | 'pins' | 'admins' | 'folders' | 'companies-new' | 'documents'>
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
    canManageFolders: true,
    canViewFolderPins: true,
    visibleTabs: ['dashboard', 'companies', 'logs', 'pins', 'admins', 'folders', 'companies-new'],
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
    canManageFolders: true,
    canViewFolderPins: false,
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
    canManageFolders: false,
    canViewFolderPins: false,
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
    canManageFolders: false,
    canViewFolderPins: false,
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
  | 'COMPANY_DELETED'

export interface DatabaseSchema {
  admins: AdminUser[]
  companies: Company[]
  files: FileRecord[]
  folders: CustomFolder[]
  logs: ActivityLog[]
  documents: BagDraft[]
  meta: { version: string; lastUpdated: string }
}

export interface SessionData {
  userId: string
  role: UserRole
  companyId?: string
  companySlug?: string
}

// ─── Documents / BAG Drafts ───────────────────────────────────────────────────
export interface BagDraft {
  id: string
  ownerId: string          // userId du créateur
  ownerLabel: string       // username
  title: string            // ex: "BAG - Maze Bank - 03/04/2026"
  templateType: 'bag'      // extensible pour d'autres templates
  status: 'draft' | 'finalized'
  content: BagContent      // toutes les données du formulaire
  createdAt: string
  updatedAt: string
}

export interface BagContent {
  // Page de garde
  entreprise: string
  secteur: string
  refDossier: string
  controleur: string
  dateAudit: string
  periodeControlee: string
  typeControle: 'routine' | 'anomalie' | 'reprise' | ''
  etatFinancier: 'stable' | 'moyen' | 'mauvais' | ''

  // Section I — Cadre juridique
  identiteGestionnaire: string
  datePriseFonction: string
  contextAudit: string
  evaluationCooperation: 'totale' | 'partielle' | 'refus' | ''
  observationsComportementales: string

  // Section II — Analyse opérationnelle
  effectifActuel: string
  stabiliteEquipes: 'stable' | 'turnover' | 'recrutement' | ''
  postesVacants: string
  horaires: string
  maitiseStocks: 'bonne' | 'moyenne' | 'insuffisante' | ''
  fluxClientele: 'regulier' | 'irregulier' | 'faible' | ''
  modeleEconomique: 'passage' | 'contrats' | 'mixte' | ''
  dependanceExterne: 'autonome' | 'partielle' | 'dependante' | ''
  difficulte1: string
  difficulte2: string
  difficulte3: string

  // Section III — Bilan comptable
  tresorerieDeclaree: string
  tresorerieReelle: string
  soldeApresFrais: string
  impotDu: string
  // Tableau 3 semaines [declared, paid, justifs, anomaly] x 3
  semaine1: { declaration: boolean; paiement: boolean; justificatifs: boolean; anomalie: string }
  semaine2: { declaration: boolean; paiement: boolean; justificatifs: boolean; anomalie: string }
  semaine3: { declaration: boolean; paiement: boolean; justificatifs: boolean; anomalie: string }
  qualificationCas: 'simple' | 'grave' | 'conformite' | ''
  detailAnomalies: string

  // Section IV — Préconisations
  conclusionViabilite: string
  // Mesures applicables
  mesureRedressement: boolean; montantRedressement: string
  mesureAmende: boolean; montantAmende: string
  mesureExoneration: boolean; dureeExoneration: string; motifExoneration: string
  mesureSubvFonctionnement: boolean; montantSubvFonct: string
  mesureSubvUrgence: boolean; montantSubvUrgence: string
  mesureAideRH: boolean
  mesureFermeture: boolean; motifFermeture: string
  mesureFraude: boolean
  mesureAutre: string
  // Résumé Discord
  resumeSituation: string
  subventionRecue: string
  motifSubvention: string
  // Signature
  lieuDate: string
  nomControleur: string
  validePar: string

  // Annexe A — Expertise comptable
  source1: string; source2: string; sourceDependance: string
  charges: Array<{ poste: string; montant: string; frequence: string; commentaire: string }>
  amendes: Array<{ type: string; bareme: string; montant: string; justification: string }>
  subventions: Array<{ type: string; demandee: boolean; montant: string; motif: string; avis: 'favorable' | 'defavorable' | '' }>
  reco1: string; reco2: string; reco3: string; recoPoinPoints: string
}

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
  canManageBAG: boolean
  visibleTabs: Array<'dashboard' | 'companies' | 'logs' | 'pins' | 'admins' | 'folders' | 'companies-new' | 'bag'>
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
    canManageBAG: true,
    visibleTabs: ['dashboard', 'companies', 'logs', 'pins', 'admins', 'folders', 'companies-new', 'bag'],
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
    canManageBAG: true,
    visibleTabs: ['dashboard', 'companies', 'logs', 'admins', 'bag'],
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
    canManageBAG: true,
    visibleTabs: ['dashboard', 'companies', 'bag'],
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
    canManageBAG: false,
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
  | 'BAG_CREATED'
  | 'BAG_UPDATED'
  | 'BAG_DELETED'


// ─── B.A.G. — Bilan d'Audit Global ───────────────────────────────────────────

export type BAGStatus = 'brouillon' | 'finalise' | 'transmis' | 'archive'

export interface BAGCheckboxes {
  // Préconisations
  redressement: boolean; amende: boolean; exoneration: boolean
  subvFonctionnement: boolean; subvUrgence: boolean
  aideRH: boolean; fermeture: boolean; fraude: boolean
  // Trésorerie
  tresOK: boolean; tresKO: boolean
  // Coopération
  coopTotale: boolean; coopPartielle: boolean; coopRefus: boolean
  // Qualification
  casSImple: boolean; casGrave: boolean; conformite: boolean
  // Stabilité
  stableEquipes: boolean; turnover: boolean; recrutement: boolean
  // Maîtrise stocks
  stockBonne: boolean; stockMoyenne: boolean; stockInsuffisante: boolean
  // Flux clientèle
  fluxRegulier: boolean; fluxIrregulier: boolean; fluxFaible: boolean
  // Modèle éco
  modPassage: boolean; modContrats: boolean; modMixte: boolean
  // Dépendance
  depAutonome: boolean; depPartielle: boolean; depTres: boolean
  // Type contrôle
  ctrlRoutine: boolean; ctrlAnomalie: boolean; ctrlReprise: boolean
  // État financier
  etatStable: boolean; etatMoyen: boolean; etatMauvais: boolean
  // Vérifications semaines
  s3Decl: boolean; s3Paie: boolean; s3Just: boolean
  s2Decl: boolean; s2Paie: boolean; s2Just: boolean
  s1Decl: boolean; s1Paie: boolean; s1Just: boolean
  // PJ statuts
  pj01: boolean; pj02: boolean; pj03: boolean; pj04: boolean
  pj05: boolean; pj06: boolean; pj07: boolean; pj08: boolean
  pj09: boolean; pj10: boolean
}

export interface BAGDocument {
  id: string
  ownerId: string        // userId du CF qui a créé le doc
  ownerLabel: string     // nom d'affichage
  status: BAGStatus
  createdAt: string
  updatedAt: string
  // Section header
  entreprise: string
  secteur: string
  dateAudit: string
  periodeControlee: string
  refDossier: string
  cfNom: string
  // Section I
  idGestionnaire: string
  datePriseFonction: string
  contexteAudit: string
  cooperationNote: string
  observationsComportement: string
  // Section II
  effectifActuel: string
  postesVacants: string
  horaireOuverture: string
  diffOp1: string; diffOp2: string; diffOp3: string
  // Section III
  tresorerieDeclaree: string
  tresorerieReelle: string
  soldeApresFrags: string
  impotDu: string
  tauxRef: string
  ecartTreso: string
  s3Anomalie: string; s2Anomalie: string; s1Anomalie: string
  detailAnomalie: string
  // Section IV
  conclusionViabilite: string
  preconisationsDetail: string
  montantRedressement: string; montantAmende: string
  dureeExoneration: string; motifExoneration: string
  montantSubvFonct: string; montantSubvUrgence: string
  autrePreco: string
  resumeDiscord: string
  // Annexe A
  sourceRevenuPrincipal: string; sourceRevenuSecondaire: string
  dependanceTiers: string
  chargesStocks: string; chargesSalaires: string
  chargesOp: string; chargesImpots: string; chargesAutres: string
  recourtTerme: string; recoMoyenTerme: string; recoLongTerme: string
  pointsAttention: string
  // Amendes annexe
  montantAmRetardEvt: string; calcAmRetardEvt: string
  montantAmRetardProd: string; calcAmRetardProd: string
  montantAmRetard24h: string; montantAmRetard48h: string; montantAmRetard72h: string
  montantAmDocManquant: string; montantAmDeductNonJust: string
  totalAmendes: string
  // Subventions annexe
  montantSubvEvt: string; motifSubvEvt: string
  montantSubvInvest: string; motifSubvInvest: string
  montantSubvFormation: string; motifSubvFormation: string
  // PJ index
  pj07desc: string; pj08desc: string; pj10desc: string
  pj01date: string; pj02date: string; pj03date: string; pj04date: string
  pj05date: string; pj06date: string; pj07date: string; pj08date: string; pj09date: string; pj10date: string
  // Signature
  dateFait: string; nomCF: string; nomDOF: string
  // Checkboxes
  checkboxes: BAGCheckboxes
}

export type BAGDraftMeta = {
  id: string; ownerId: string; ownerLabel: string
  entreprise: string; status: BAGStatus
  createdAt: string; updatedAt: string
}

export interface DatabaseSchema {
  admins: AdminUser[]
  companies: Company[]
  files: FileRecord[]
  folders: CustomFolder[]
  logs: ActivityLog[]
  bags: BAGDocument[]
  meta: { version: string; lastUpdated: string }
}

export interface SessionData {
  userId: string
  role: UserRole
  companyId?: string
  companySlug?: string
}

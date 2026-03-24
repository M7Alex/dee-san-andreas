import { CompanyCategory } from '@/types'

export interface CompanyTemplate {
  name: string; slug: string; category: CompanyCategory
  color: string; accentColor: string; description: string
}

export const COMPANIES: CompanyTemplate[] = [
  // Gouvernement
  { name:'SASP',slug:'sasp',category:'gouvernement',color:'#0a1628',accentColor:'#1e40af',description:'San Andreas State Police' },
  { name:'Gruppe Sechs',slug:'gruppe-sechs',category:'gouvernement',color:'#0f1a0f',accentColor:'#166534',description:'Sécurité privée officielle' },
  { name:'EMS',slug:'ems',category:'gouvernement',color:'#1a0a0a',accentColor:'#dc2626',description:'Emergency Medical Services' },
  { name:'EMS Cayo',slug:'ems-cayo',category:'gouvernement',color:'#1a0f0a',accentColor:'#ea580c',description:'EMS Cayo Perico' },
  { name:'Gouvernement',slug:'gouvernement',category:'gouvernement',color:'#0a0a1a',accentColor:'#7c3aed',description:'Administration gouvernementale' },
  { name:'Gouvernement et Milice Cayo',slug:'gouvernement-cayo',category:'gouvernement',color:'#0a1214',accentColor:'#0891b2',description:'Gouvernance de Cayo Perico' },
  { name:'Département de la Justice',slug:'justice',category:'gouvernement',color:'#14100a',accentColor:'#d97706',description:'Système judiciaire' },
  { name:'Sénat',slug:'senat',category:'gouvernement',color:'#0a0a12',accentColor:'#6366f1',description:'Chambre sénatoriale' },
  { name:'LS Avocat',slug:'ls-avocat',category:'gouvernement',color:'#120a10',accentColor:'#a21caf',description:'Barreau de Los Santos' },
  // Restauration
  { name:'LTD Little Seoul',slug:'ltd-little-seoul',category:'restauration',color:'#0a1210',accentColor:'#059669',description:'LTD Convenience - Little Seoul' },
  { name:'LTD Mirror Park',slug:'ltd-mirror-park',category:'restauration',color:'#0a1210',accentColor:'#10b981',description:'LTD Convenience - Mirror Park' },
  { name:'LTD Groove Street',slug:'ltd-groove-street',category:'restauration',color:'#0d120a',accentColor:'#16a34a',description:'LTD Convenience - Groove Street' },
  { name:'LTD Paleto Bay',slug:'ltd-paleto',category:'restauration',color:'#0a1210',accentColor:'#15803d',description:'LTD Convenience - Paleto Bay' },
  { name:'LTD Route 68',slug:'ltd-route-68',category:'restauration',color:'#121008',accentColor:'#84cc16',description:'LTD Convenience - Route 68' },
  { name:'LTD Sandy Shores',slug:'ltd-sandy-shores',category:'restauration',color:'#150f08',accentColor:'#ca8a04',description:'LTD Convenience - Sandy Shores' },
  { name:'LTD Strawberry',slug:'ltd-strawberry',category:'restauration',color:'#150a0a',accentColor:'#e11d48',description:'LTD Convenience - Strawberry' },
  { name:'LTD Cayo',slug:'ltd-cayo',category:'restauration',color:'#0a1510',accentColor:'#0d9488',description:'LTD Convenience - Cayo Perico' },
  { name:'Burger Shot Sud',slug:'burger-shot-sud',category:'restauration',color:'#150a00',accentColor:'#f97316',description:'Burger Shot - Quartier Sud' },
  { name:'Burger Shot Nord',slug:'burger-shot-nord',category:'restauration',color:'#120a00',accentColor:'#fb923c',description:'Burger Shot - Quartier Nord' },
  { name:'Up-n-Atom',slug:'up-n-atom',category:'restauration',color:'#150800',accentColor:'#ef4444',description:'Up-n-Atom Burger' },
  { name:'Pizzeria',slug:'pizzeria',category:'restauration',color:'#150a00',accentColor:'#f59e0b',description:'La Pizzeria de Los Santos' },
  { name:"Horny's",slug:'hornys',category:'restauration',color:'#100a15',accentColor:'#c026d3',description:"Horny's Diner" },
  { name:'Noodle Exchange',slug:'noodle-exchange',category:'restauration',color:'#100800',accentColor:'#d97706',description:'Noodle Exchange Restaurant' },
  { name:'Bean Machine',slug:'bean-machine',category:'restauration',color:'#0a0800',accentColor:'#92400e',description:'Bean Machine Coffee' },
  { name:'La Linterna',slug:'la-linterna',category:'restauration',color:'#0f0800',accentColor:'#b45309',description:'La Linterna - Cuisine mexicaine' },
  { name:'American Donuts',slug:'american-donuts',category:'restauration',color:'#150808',accentColor:'#f472b6',description:'American Donuts' },
  // Évènementiel
  { name:'Bahamas',slug:'bahamas',category:'evenementiel',color:'#000a15',accentColor:'#0ea5e9',description:'Bahamas Mamas West' },
  { name:'Rockford Records',slug:'rockford-records',category:'evenementiel',color:'#100010',accentColor:'#d946ef',description:'Rockford Records Label' },
  { name:'Pacific Bluffs',slug:'pacific-bluffs',category:'evenementiel',color:'#000a12',accentColor:'#38bdf8',description:'Pacific Bluffs Country Club' },
  { name:'The Hen House',slug:'hen-house',category:'evenementiel',color:'#0f0a00',accentColor:'#fbbf24',description:'The Hen House' },
  { name:'The Palace',slug:'the-palace',category:'evenementiel',color:'#0a0010',accentColor:'#8b5cf6',description:'The Palace Night Club' },
  { name:'Yellow Jack',slug:'yellow-jack',category:'evenementiel',color:'#150f00',accentColor:'#eab308',description:'Yellow Jack Inn' },
  { name:'Club 77',slug:'club-77',category:'evenementiel',color:'#100015',accentColor:'#a855f7',description:'Club 77 - Downtown LS' },
  { name:'Cayo Beach',slug:'cayo-beach',category:'evenementiel',color:'#000f10',accentColor:'#14b8a6',description:'Cayo Beach Club' },
  { name:'Mayfair Nightclub',slug:'mayfair',category:'evenementiel',color:'#050015',accentColor:'#6366f1',description:'Mayfair Nightclub' },
  { name:'Studio 51',slug:'studio-51',category:'evenementiel',color:'#150005',accentColor:'#fb7185',description:'Studio 51 - Production musicale' },
  // Utilitaire
  { name:'Dynasty 8',slug:'dynasty-8',category:'utilitaire',color:'#0a0f14',accentColor:'#3b82f6',description:'Agence immobilière Dynasty 8' },
  { name:'Weazel News',slug:'weazel-news',category:'utilitaire',color:'#150800',accentColor:'#f97316',description:'Weazel News - Chaîne TV' },
  { name:'Cayo News',slug:'cayo-news',category:'utilitaire',color:'#001015',accentColor:'#22d3ee',description:'Cayo News Network' },
  { name:'Paleto Garage',slug:'paleto-garage',category:'utilitaire',color:'#100a00',accentColor:'#f59e0b',description:'Paleto Bay Garage' },
  { name:"Benny's Luxury",slug:'bennys-luxury',category:'utilitaire',color:'#0a0800',accentColor:'#d97706',description:"Benny's Original Motor Works - Luxury" },
  { name:'LS Custom',slug:'ls-custom',category:'utilitaire',color:'#0f0000',accentColor:'#dc2626',description:'Los Santos Customs' },
  { name:'Cayo Garage',slug:'cayo-garage',category:'utilitaire',color:'#0a1200',accentColor:'#65a30d',description:'Cayo Perico Garage' },
  { name:'Harmony Repair',slug:'harmony-repair',category:'utilitaire',color:'#0a1000',accentColor:'#4ade80',description:'Harmony Auto Repair' },
  { name:'Roxwood Repair',slug:'roxwood-repair',category:'utilitaire',color:'#0f1400',accentColor:'#86efac',description:'Roxwood Repair Shop' },
  { name:'Concessionnaire LS',slug:'concessionnaire-ls',category:'utilitaire',color:'#001015',accentColor:'#2563eb',description:'Concessionnaire Automobile LS' },
  { name:'Concessionnaire Roxwood',slug:'concessionnaire-roxwood',category:'utilitaire',color:'#000f14',accentColor:'#1d4ed8',description:'Concessionnaire Automobile Roxwood' },
  { name:'Université',slug:'universite',category:'utilitaire',color:'#0a001a',accentColor:'#7c3aed',description:"Université de l'État de San Andreas" },
  { name:'Taxi',slug:'taxi',category:'utilitaire',color:'#150f00',accentColor:'#facc15',description:'Los Santos Taxi Co.' },
  // Production
  { name:'Lumberjack',slug:'lumberjack',category:'production',color:'#0a1000',accentColor:'#a16207',description:'Lumberjack Forestry Corp.' },
  { name:'Abatteur',slug:'abatteur',category:'production',color:'#150a00',accentColor:'#dc2626',description:"Abattoir de l'État" },
  { name:'Globe Oil',slug:'globe-oil',category:'production',color:'#100800',accentColor:'#b45309',description:'Globe Oil - Énergie pétrolière' },
  { name:'Ferme LS',slug:'ferme-ls',category:'production',color:'#0a1200',accentColor:'#65a30d',description:'Ferme de Los Santos' },
  { name:'Ferme Cayo Perico',slug:'ferme-cayo',category:'production',color:'#001508',accentColor:'#16a34a',description:'Exploitation agricole de Cayo' },
  { name:'Cigare Cayo Perico',slug:'cigare-cayo',category:'production',color:'#150500',accentColor:'#c2410c',description:'Fabrique de cigares - Cayo Perico' },
  { name:'E-Cola',slug:'e-cola',category:'production',color:'#150000',accentColor:'#ef4444',description:'E-Cola Beverages Corp.' },
  { name:'Recycan',slug:'recycan',category:'production',color:'#001508',accentColor:'#4ade80',description:'Recycan - Recyclage industriel' },
  { name:'Roxwood PWR',slug:'roxwood-pwr',category:'production',color:'#0a0800',accentColor:'#facc15',description:'Roxwood Power Plant' },
  { name:'Piger Logistics',slug:'piger-logistics',category:'production',color:'#001014',accentColor:'#0891b2',description:'Piger Logistics & Transport' },
  { name:'Distilling Co.',slug:'distilling-co',category:'production',color:'#150800',accentColor:'#f59e0b',description:'San Andreas Distilling Company' },
]

export const CATEGORY_LABELS: Record<string, string> = {
  gouvernement:'Gouvernement / EMS', restauration:'Restauration',
  evenementiel:'Évènementiel', utilitaire:'Utilitaire', production:'Production',
}
export const CATEGORY_ICONS: Record<string, string> = {
  gouvernement:'⚖️', restauration:'🍽️', evenementiel:'🎭', utilitaire:'🔧', production:'🏭',
}
export function getCompaniesByCategory() {
  const groups: Record<string, CompanyTemplate[]> = {}
  for (const c of COMPANIES) { if (!groups[c.category]) groups[c.category] = []; groups[c.category].push(c) }
  return groups
}

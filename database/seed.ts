// database/seed.ts
// Run: npx ts-node database/seed.ts
// Or: node -r ts-node/register database/seed.ts

import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

export const COMPANIES_DATA = [
  // ─── GOUVERNEMENT / EMS ───────────────────────────────────────────────────
  { name: 'SASP', slug: 'sasp', category: 'gouvernement', color: '#1a3a6b', description: 'San Andreas State Police' },
  { name: 'Gruppe Sechs', slug: 'gruppe-sechs', category: 'gouvernement', color: '#2d4a1e', description: 'Sécurité privée gouvernementale' },
  { name: 'EMS', slug: 'ems', category: 'gouvernement', color: '#b22222', description: 'Emergency Medical Services' },
  { name: 'EMS Cayo', slug: 'ems-cayo', category: 'gouvernement', color: '#8b1a1a', description: 'EMS — Île Cayo Perico' },
  { name: 'Gouvernement', slug: 'gouvernement', category: 'gouvernement', color: '#8b6914', description: 'Administration centrale' },
  { name: 'Gouvernement et Milice Cayo', slug: 'gouvernement-cayo', category: 'gouvernement', color: '#6b4e12', description: 'Gouvernement — Cayo Perico' },
  { name: 'Département de la Justice', slug: 'justice', category: 'gouvernement', color: '#1a1a4a', description: 'Système judiciaire' },
  { name: 'Sénat', slug: 'senat', category: 'gouvernement', color: '#2a1a4a', description: 'Chambre sénatoriale' },
  { name: 'LS Avocat', slug: 'ls-avocat', category: 'gouvernement', color: '#3a2a5a', description: 'Cabinet d\'avocats' },

  // ─── RESTAURATION ────────────────────────────────────────────────────────
  { name: 'LTD Little Seoul', slug: 'ltd-little-seoul', category: 'restauration', color: '#7a2020', description: 'LTD — Little Seoul' },
  { name: 'LTD Mirror Park', slug: 'ltd-mirror-park', category: 'restauration', color: '#1a5a2a', description: 'LTD — Mirror Park' },
  { name: 'LTD Groove Street', slug: 'ltd-groove-street', category: 'restauration', color: '#4a1a6a', description: 'LTD — Groove Street' },
  { name: 'LTD Paleto Bay', slug: 'ltd-paleto-bay', category: 'restauration', color: '#1a4a5a', description: 'LTD — Paleto Bay' },
  { name: 'LTD Route 68', slug: 'ltd-route-68', category: 'restauration', color: '#5a3a1a', description: 'LTD — Route 68' },
  { name: 'LTD Sandy Shores', slug: 'ltd-sandy-shores', category: 'restauration', color: '#5a4a1a', description: 'LTD — Sandy Shores' },
  { name: 'LTD Strawberry', slug: 'ltd-strawberry', category: 'restauration', color: '#6a1a2a', description: 'LTD — Strawberry' },
  { name: 'LTD Cayo', slug: 'ltd-cayo', category: 'restauration', color: '#1a5a4a', description: 'LTD — Cayo Perico' },
  { name: 'Burger Shot Sud', slug: 'burger-shot-sud', category: 'restauration', color: '#8b3a00', description: 'Burger Shot — Sud' },
  { name: 'Burger Shot Nord', slug: 'burger-shot-nord', category: 'restauration', color: '#7a3500', description: 'Burger Shot — Nord' },
  { name: 'Up-n-Atom', slug: 'up-n-atom', category: 'restauration', color: '#3a5a00', description: 'Up-n-Atom Burger' },
  { name: 'Pizzeria', slug: 'pizzeria', category: 'restauration', color: '#8b1a00', description: 'La Pizzeria' },
  { name: 'Horny\'s', slug: 'hornys', category: 'restauration', color: '#6a1a3a', description: 'Horny\'s Restaurant' },
  { name: 'Noodle Exchange', slug: 'noodle-exchange', category: 'restauration', color: '#3a1a5a', description: 'Noodle Exchange' },
  { name: 'Bean Machine', slug: 'bean-machine', category: 'restauration', color: '#3a2010', description: 'Bean Machine Coffee' },
  { name: 'La Linterna', slug: 'la-linterna', category: 'restauration', color: '#5a2010', description: 'La Linterna' },
  { name: 'American Donuts', slug: 'american-donuts', category: 'restauration', color: '#8b4a6a', description: 'American Donuts' },

  // ─── ÉVÈNEMENTIEL ────────────────────────────────────────────────────────
  { name: 'Bahamas', slug: 'bahamas', category: 'evenementiel', color: '#1a3a6a', description: 'Bahamas Mamas' },
  { name: 'Rockford Records', slug: 'rockford-records', category: 'evenementiel', color: '#1a1a1a', description: 'Label musical' },
  { name: 'Pacific Bluffs', slug: 'pacific-bluffs', category: 'evenementiel', color: '#1a4a5a', description: 'Club Pacific Bluffs' },
  { name: 'The Hen House', slug: 'the-hen-house', category: 'evenementiel', color: '#5a3a1a', description: 'The Hen House Bar' },
  { name: 'The Palace', slug: 'the-palace', category: 'evenementiel', color: '#4a1a1a', description: 'The Palace Club' },
  { name: 'Yellow Jack', slug: 'yellow-jack', category: 'evenementiel', color: '#6a5a00', description: 'Yellow Jack Bar' },
  { name: 'Club 77', slug: 'club-77', category: 'evenementiel', color: '#2a1a4a', description: 'Club 77' },
  { name: 'Cayo Beach', slug: 'cayo-beach', category: 'evenementiel', color: '#0a4a3a', description: 'Cayo Beach Club' },
  { name: 'Mayfair Nightclub', slug: 'mayfair-nightclub', category: 'evenementiel', color: '#3a0a4a', description: 'Mayfair Nightclub' },
  { name: 'Studio 51', slug: 'studio-51', category: 'evenementiel', color: '#1a2a4a', description: 'Studio 51' },

  // ─── UTILITAIRE ──────────────────────────────────────────────────────────
  { name: 'Dynasty 8', slug: 'dynasty-8', category: 'utilitaire', color: '#2a4a2a', description: 'Immobilier Dynasty 8' },
  { name: 'Weazel News', slug: 'weazel-news', category: 'utilitaire', color: '#8b2a00', description: 'Chaîne d\'information' },
  { name: 'Cayo News', slug: 'cayo-news', category: 'utilitaire', color: '#7a2a00', description: 'Actualités Cayo Perico' },
  { name: 'Paleto Garage', slug: 'paleto-garage', category: 'utilitaire', color: '#2a2a4a', description: 'Garage — Paleto Bay' },
  { name: 'Benny\'s Luxury', slug: 'bennys-luxury', category: 'utilitaire', color: '#3a2a00', description: 'Benny\'s Luxury Motors' },
  { name: 'LS Custom', slug: 'ls-custom', category: 'utilitaire', color: '#0a2a4a', description: 'Los Santos Customs' },
  { name: 'Cayo Garage', slug: 'cayo-garage', category: 'utilitaire', color: '#1a3a2a', description: 'Garage — Cayo Perico' },
  { name: 'Harmony Repair', slug: 'harmony-repair', category: 'utilitaire', color: '#2a3a0a', description: 'Harmony Repair Shop' },
  { name: 'Roxwood Repair', slug: 'roxwood-repair', category: 'utilitaire', color: '#3a2a0a', description: 'Roxwood Repair' },
  { name: 'Concessionnaire LS', slug: 'concessionnaire-ls', category: 'utilitaire', color: '#0a3a2a', description: 'Concessionnaire — LS' },
  { name: 'Concessionnaire Roxwood', slug: 'concessionnaire-roxwood', category: 'utilitaire', color: '#2a0a3a', description: 'Concessionnaire — Roxwood' },
  { name: 'Université', slug: 'universite', category: 'utilitaire', color: '#1a1a4a', description: 'Université de San Andreas' },
  { name: 'Taxi', slug: 'taxi', category: 'utilitaire', color: '#6a5a00', description: 'Services Taxi' },

  // ─── PRODUCTION ──────────────────────────────────────────────────────────
  { name: 'Lumberjack', slug: 'lumberjack', category: 'production', color: '#2a3a0a', description: 'Exploitation forestière' },
  { name: 'Abatteur', slug: 'abatteur', category: 'production', color: '#5a1a1a', description: 'Abattoir industriel' },
  { name: 'Globe Oil', slug: 'globe-oil', category: 'production', color: '#0a2a4a', description: 'Pétrole Globe Oil' },
  { name: 'Ferme LS', slug: 'ferme-ls', category: 'production', color: '#2a4a0a', description: 'Ferme Los Santos' },
  { name: 'Ferme Cayo Perico', slug: 'ferme-cayo', category: 'production', color: '#1a4a1a', description: 'Ferme Cayo Perico' },
  { name: 'Cigare Cayo Perico', slug: 'cigare-cayo', category: 'production', color: '#4a2a0a', description: 'Manufacture cigares' },
  { name: 'E-Cola', slug: 'e-cola', category: 'production', color: '#0a4a2a', description: 'E-Cola Beverages' },
  { name: 'Recycan', slug: 'recycan', category: 'production', color: '#2a4a2a', description: 'Recyclage Recycan' },
  { name: 'Roxwood PWR', slug: 'roxwood-pwr', category: 'production', color: '#0a2a3a', description: 'Roxwood Power' },
  { name: 'Piger Logistics', slug: 'piger-logistics', category: 'production', color: '#3a3a0a', description: 'Logistique Piger' },
  { name: 'Distilling Co.', slug: 'distilling-co', category: 'production', color: '#3a1a2a', description: 'Distillerie' },
]

export const DEFAULT_FOLDERS = ['Financier', 'RH', 'Contrats', 'Logistique', 'Stratégie']

export async function seed() {
  console.log('🌱 Starting database seed...')

  // Create superadmin
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin2024!'
  const hash = await bcrypt.hash(superAdminPassword, 12)

  await sql`
    INSERT INTO users (email, password_hash, name, role)
    VALUES (${process.env.SUPERADMIN_EMAIL || 'superadmin@dee-sanandreas.gov'}, ${hash}, 'Super Administrateur', 'SUPERADMIN')
    ON CONFLICT (email) DO NOTHING
  `
  console.log('✓ SuperAdmin created')

  // Create companies with random PINs
  for (const company of COMPANIES_DATA) {
    const pin = Math.floor(1000 + Math.random() * 9000).toString()
    const pinHash = await bcrypt.hash(pin, 10)

    const result = await sql`
      INSERT INTO companies (name, slug, category, color, description, pin_hash)
      VALUES (${company.name}, ${company.slug}, ${company.category}, ${company.color}, ${company.description}, ${pinHash})
      ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
      RETURNING id, name, slug
    `

    const companyId = result.rows[0].id

    // Create default folders
    for (const folderName of DEFAULT_FOLDERS) {
      await sql`
        INSERT INTO folders (name, company_id, is_default)
        VALUES (${folderName}, ${companyId}, true)
        ON CONFLICT DO NOTHING
      `
    }

    console.log(`✓ ${company.name} (PIN: ${pin}) — save this PIN!`)
  }

  console.log('✅ Seed complete!')
}

seed().catch(console.error)

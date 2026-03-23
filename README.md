# 🦅 Département Économique & Entrepreneurial — État de San Andreas

Plateforme gouvernementale de gestion économique et documentaire pour serveur GTA RP.

## Stack

- **Frontend**: Next.js 14 App Router + React + Tailwind CSS
- **Base de données**: GitHub (fichiers JSON via API GitHub)
- **Stockage fichiers**: Vercel Blob
- **Auth**: JWT + bcrypt (PIN hachés)

## Architecture "GitHub comme DB"

Toutes les données (entreprises, fichiers, logs, admins) sont stockées dans un fichier `db/database.json` dans un repo GitHub privé. L'API Next.js lit/écrit ce fichier via l'API GitHub REST.

**Avantages** :
- Zéro coût supplémentaire (GitHub gratuit)
- Historique complet des modifications (Git)
- Sauvegarde automatique
- Facile à inspecter/modifier manuellement

**Limitations** :
- Rate limits GitHub (5000 req/h avec token)
- Pas idéal pour >1000 fichiers

## Installation

### 1. Créer le repo de base de données GitHub

```bash
# Créer un repo PRIVÉ "dee-database" sur GitHub
# Puis créer le dossier initial :
mkdir -p db && echo '{}' > db/database.json
git add . && git commit -m "init" && git push
```

### 2. Variables d'environnement

Copier `.env.example` → `.env.local` et remplir toutes les valeurs.

```bash
cp .env.example .env.local
```

### 3. Déployer sur Vercel

```bash
# Via CLI
npx vercel --prod

# Ou connecter le repo GitHub à vercel.com
```

Ajouter toutes les variables d'env dans Vercel Dashboard > Settings > Environment Variables.

### 4. Initialisation (une seule fois)

```bash
curl -X POST https://votre-site.vercel.app/api/admin/setup \
  -H "Content-Type: application/json" \
  -d '{"setupToken": "votre-SETUP_TOKEN"}'
```

Cela crée :
- Le superadmin (username: `superadmin`)
- Toutes les entreprises avec PINs générés aléatoirement

**⚠️ Changez le mot de passe superadmin immédiatement après !**

## Rôles

| Rôle | Accès |
|------|-------|
| `superadmin` | Tout + gestion PINs + création admins |
| `admin` | Toutes les entreprises + gestion fichiers |
| `company` | Leur entreprise uniquement via PIN |

## Sécurité

- PINs hachés avec bcrypt (jamais en clair en base)
- JWT signé (24h d'expiration)
- Rate limiting: 5 tentatives / 30s de cooldown
- Validation des types de fichiers (PDF, DOCX, XLSX, PNG, JPEG)
- Taille max: 10MB par fichier

## Structure

```
app/
  page.tsx              # Landing page publique
  login/page.tsx        # Connexion admin
  dashboard/page.tsx    # Dashboard admin
  company/[slug]/       # Page entreprise + PIN
  api/
    auth/               # Login, logout, session
    files/              # Upload, delete, pin, list
    companies/          # Liste entreprises
    admin/              # Stats, logs, PINs, setup

lib/
  github-db.ts          # Couche DB GitHub
  auth.ts               # JWT + bcrypt + rate limit
  blob.ts               # Vercel Blob helpers
  companies-data.ts     # 60+ entreprises

types/index.ts          # TypeScript types
```

-- ═══════════════════════════════════════════════════════════════════════════════
-- DEE San Andreas — Database Schema
-- PostgreSQL (Vercel Postgres / Supabase compatible)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUMS ───────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('SUPERADMIN', 'ADMIN', 'COMPANY');
CREATE TYPE file_status AS ENUM ('ACTIVE', 'DELETED', 'ARCHIVED');
CREATE TYPE log_action AS ENUM (
  'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'COMPANY_ACCESS', 'COMPANY_ACCESS_FAILED',
  'FILE_UPLOAD', 'FILE_DELETE', 'FILE_DOWNLOAD', 'FILE_PIN', 'FILE_UNPIN',
  'FOLDER_CREATE', 'FOLDER_DELETE', 'COMPANY_CREATE', 'COMPANY_UPDATE',
  'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'PIN_RESET', 'PIN_VIEW',
  'PERMISSION_CHANGE', 'RATE_LIMIT_HIT'
);

-- ─── COMPANIES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) UNIQUE NOT NULL,
  category    VARCHAR(100) NOT NULL,
  description TEXT,
  color       VARCHAR(7) DEFAULT '#c9a227',
  pin_hash    VARCHAR(255) NOT NULL,
  is_active   BOOLEAN DEFAULT true,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  role          user_role DEFAULT 'ADMIN',
  is_active     BOOLEAN DEFAULT true,
  last_login    TIMESTAMPTZ,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RATE LIMITING ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier  VARCHAR(500) NOT NULL, -- ip:target
  attempts    INTEGER DEFAULT 1,
  locked_until TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);

-- ─── FOLDERS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS folders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES folders(id) ON DELETE CASCADE,
  is_default  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FILES ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS files (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  mime_type     VARCHAR(255) NOT NULL,
  size          BIGINT NOT NULL,
  blob_url      TEXT NOT NULL,
  folder_id     UUID REFERENCES folders(id) ON DELETE SET NULL,
  company_id    UUID REFERENCES companies(id) ON DELETE CASCADE,
  uploaded_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_by_pin BOOLEAN DEFAULT false, -- uploaded via PIN (company user)
  is_pinned     BOOLEAN DEFAULT false,
  status        file_status DEFAULT 'ACTIVE',
  tags          TEXT[],
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

-- ─── ACTIVITY LOGS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  company_id   UUID REFERENCES companies(id) ON DELETE SET NULL,
  action       log_action NOT NULL,
  details      JSONB DEFAULT '{}',
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  type        VARCHAR(50) DEFAULT 'info',
  is_read     BOOLEAN DEFAULT false,
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SESSIONS (for PIN-based company sessions) ──────────────────────────────
CREATE TABLE IF NOT EXISTS company_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  token_hash  VARCHAR(255) NOT NULL,
  ip_address  INET,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_files_company ON files(company_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_files_pinned ON files(company_id, is_pinned) WHERE is_pinned = true AND status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_logs_company ON activity_logs(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_folders_company ON folders(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON company_sessions(token_hash);

-- ─── TRIGGERS: updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER files_updated_at BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── DEFAULT DATA ────────────────────────────────────────────────────────────
-- Default folders for each company (will be created via seed script)
-- See database/seed.ts

-- ─── CLEANUP FUNCTION ────────────────────────────────────────────────────────
-- Clean expired sessions and rate limits (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired()
RETURNS void AS $$
BEGIN
  DELETE FROM company_sessions WHERE expires_at < NOW();
  DELETE FROM rate_limits WHERE updated_at < NOW() - INTERVAL '1 hour' AND locked_until IS NULL;
  DELETE FROM rate_limits WHERE locked_until < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

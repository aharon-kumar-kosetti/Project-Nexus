-- ═══════════════════════════════════════════════════
-- PROJECT NEXUS — DATABASE SCHEMA
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  user_id       VARCHAR(100) PRIMARY KEY,
  password_hash TEXT NOT NULL,
  display_name  VARCHAR(150) NOT NULL DEFAULT '',
  role          VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS display_name VARCHAR(150);

UPDATE users
SET display_name = COALESCE(NULLIF(display_name, ''), user_id)
WHERE display_name IS NULL OR display_name = '';

ALTER TABLE users
ALTER COLUMN display_name SET NOT NULL;

CREATE TABLE IF NOT EXISTS projects (
  id            VARCHAR(10) PRIMARY KEY,
  user_id       VARCHAR(100),
  title         VARCHAR(255) NOT NULL,
  description   TEXT DEFAULT '',
  status        VARCHAR(20) DEFAULT 'Upcoming',
  priority      VARCHAR(20) DEFAULT 'Medium',
  progress      INTEGER DEFAULT 0,
  tags          JSONB DEFAULT '[]',
  tech_stack    JSONB DEFAULT '[]',
  repo_link     VARCHAR(500) DEFAULT '',
  deploy_link   VARCHAR(500) DEFAULT '',
  deploy_status VARCHAR(20) DEFAULT 'not-deployed',
  deploy_label  VARCHAR(255) DEFAULT '',
  docs          JSONB DEFAULT '[]',
  deadline      DATE,
  created_at    DATE DEFAULT CURRENT_DATE,
  tasks         JSONB DEFAULT '[]',
  notes         TEXT DEFAULT '',
  activity_log  JSONB DEFAULT '[]',
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS user_id VARCHAR(100);

ALTER TABLE projects
DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

ALTER TABLE projects
ADD CONSTRAINT projects_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

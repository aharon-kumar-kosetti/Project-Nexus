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

CREATE TABLE IF NOT EXISTS project_access (
  id                  BIGSERIAL PRIMARY KEY,
  project_id          VARCHAR(10) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id             VARCHAR(100) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  access_level        VARCHAR(20) NOT NULL DEFAULT 'read',
  granted_by_user_id  VARCHAR(100) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT project_access_level_check CHECK (access_level IN ('read')),
  CONSTRAINT project_access_unique_project_user UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_access_user_id ON project_access(user_id);
CREATE INDEX IF NOT EXISTS idx_project_access_project_id ON project_access(project_id);

CREATE TABLE IF NOT EXISTS support_messages (
  id             BIGSERIAL PRIMARY KEY,
  sender_user_id VARCHAR(100) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  message_text   TEXT NOT NULL,
  is_read        BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON support_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_is_read ON support_messages(is_read);

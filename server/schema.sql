-- ═══════════════════════════════════════════════════
-- PROJECT NEXUS — DATABASE SCHEMA
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS projects (
  id            VARCHAR(10) PRIMARY KEY,
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

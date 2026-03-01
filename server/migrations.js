import pool from "./db.js";

let migrationPromise = null;

async function runProjectAccessMigration() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(`
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
            )
        `);

        await client.query("CREATE INDEX IF NOT EXISTS idx_project_access_user_id ON project_access(user_id)");
        await client.query("CREATE INDEX IF NOT EXISTS idx_project_access_project_id ON project_access(project_id)");

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

export async function ensureMigrations() {
    if (!migrationPromise) {
        migrationPromise = runProjectAccessMigration()
            .then(() => {
                console.log("  ✓ DB migrations ensured");
            })
            .catch((err) => {
                migrationPromise = null;
                console.error("  ✗ DB migration failed:", err.message);
                throw err;
            });
    }

    return migrationPromise;
}

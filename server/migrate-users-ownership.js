import "dotenv/config";
import pg from "pg";
import { hashPassword } from "./utils/password.js";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
const shouldUseSsl =
    process.env.POSTGRES_SSL === "true" ||
    databaseUrl?.includes("neon.tech") ||
    databaseUrl?.includes("neon.database");

if (!databaseUrl) {
    console.error("❌ Missing DATABASE_URL environment variable.");
    process.exit(1);
}

const ownerUserId = String(
    process.env.LEGACY_OWNER_USER_ID || process.env.AUTH_USER_ID || "tony.stark"
).trim();
const ownerDisplayName = String(
    process.env.LEGACY_OWNER_DISPLAY_NAME || "Tony Stark"
).trim();
const ownerPassword = String(
    process.env.LEGACY_OWNER_PASSWORD || process.env.AUTH_PASSWORD || "ghost4u"
);

if (!ownerUserId || !ownerPassword) {
    console.error("❌ Owner userId/password is missing.");
    console.error("Set LEGACY_OWNER_USER_ID and LEGACY_OWNER_PASSWORD in .env");
    process.exit(1);
}

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
});

async function migrate() {
    const client = await pool.connect();

    try {
        console.log("🚀 Running ownership migration...");
        await client.query("BEGIN");

        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id       VARCHAR(100) PRIMARY KEY,
                password_hash TEXT NOT NULL,
                display_name  VARCHAR(150) NOT NULL DEFAULT '',
                role          VARCHAR(20) NOT NULL DEFAULT 'user',
                created_at    TIMESTAMPTZ DEFAULT NOW(),
                updated_at    TIMESTAMPTZ DEFAULT NOW()
            )
        `);

        await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(150)");
        await client.query(`
            UPDATE users
            SET display_name = COALESCE(NULLIF(display_name, ''), user_id)
            WHERE display_name IS NULL OR display_name = ''
        `);
        await client.query("ALTER TABLE users ALTER COLUMN display_name SET NOT NULL");

        await client.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_id VARCHAR(100)");

        const ownerPasswordHash = await hashPassword(ownerPassword);

        await client.query(
            `INSERT INTO users (user_id, password_hash, display_name, role)
             VALUES ($1, $2, $3, 'admin')
             ON CONFLICT (user_id)
             DO UPDATE SET
                password_hash = EXCLUDED.password_hash,
                display_name = EXCLUDED.display_name,
                role = 'admin',
                updated_at = NOW()`,
            [ownerUserId, ownerPasswordHash, ownerDisplayName || ownerUserId]
        );

        const backfillResult = await client.query(
            `UPDATE projects
             SET user_id = $1
             WHERE user_id IS NULL OR BTRIM(user_id) = ''`,
            [ownerUserId]
        );

        const orphanFixResult = await client.query(
            `UPDATE projects p
             SET user_id = $1
             WHERE NOT EXISTS (
                 SELECT 1 FROM users u WHERE u.user_id = p.user_id
             )`,
            [ownerUserId]
        );

        await client.query("ALTER TABLE projects ALTER COLUMN user_id SET NOT NULL");
        await client.query("ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey");
        await client.query(
            `ALTER TABLE projects
             ADD CONSTRAINT projects_user_id_fkey
             FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE`
        );
        await client.query("CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)");

        await client.query("COMMIT");

        console.log("✅ Migration complete.");
        console.log(`👤 Owner user: ${ownerUserId} (${ownerDisplayName || ownerUserId})`);
        console.log(`📦 Projects assigned from null/empty owners: ${backfillResult.rowCount}`);
        console.log(`🔧 Projects reassigned from orphan owners: ${orphanFixResult.rowCount}`);
        console.log("🔐 Owner role: admin");
        console.log("ℹ️ Owner password: value from LEGACY_OWNER_PASSWORD or AUTH_PASSWORD in .env");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ Migration failed:", err.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();

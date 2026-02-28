// ═══════════════════════════════════════════════════
// DATABASE CONNECTION — PostgreSQL Pool
// ═══════════════════════════════════════════════════

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const shouldUseSsl =
    process.env.POSTGRES_SSL === "true" ||
    databaseUrl?.includes("neon.tech") ||
    databaseUrl?.includes("neon.database");

if (!databaseUrl) {
    console.error("  ✗ Missing DATABASE_URL environment variable.");
    console.error("  → Create a .env file from .env.example and set DATABASE_URL.");
    process.exit(1);
}

const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
});

// Test connection on startup
pool.query("SELECT NOW()")
    .then(() => console.log("  ✓ PostgreSQL connected"))
    .catch((err) => {
        console.error("  ✗ PostgreSQL connection failed:", err.message);
        process.exit(1);
    });

export default pool;

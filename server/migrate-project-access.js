import "dotenv/config";
import { ensureMigrations } from "./migrations.js";

async function main() {
    try {
        console.log("🚀 Running project access migration...");
        await ensureMigrations();
        console.log("✅ Project access migration complete.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Project access migration failed:", err.message);
        process.exit(1);
    }
}

main();

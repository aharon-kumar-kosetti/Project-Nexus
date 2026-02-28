import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3001;

// ── Start ──
app.listen(PORT, () => {
    console.log("");
    console.log("  ◈ STARK·WEBB BACKEND ◈");
    console.log(`  → Server running on http://localhost:${PORT}`);
    console.log(`  → API: http://localhost:${PORT}/api/projects`);
    console.log("");
});

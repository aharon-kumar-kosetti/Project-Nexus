// ═══════════════════════════════════════════════════
// EXPRESS SERVER — Project Nexus Backend
// ═══════════════════════════════════════════════════

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import projectRoutes from "./routes/projects.js";
import uploadRoutes from "./routes/uploads.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── Static: serve uploaded files ──
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ── Routes ──
app.use("/api/projects", projectRoutes);
app.use("/api/projects", uploadRoutes);

// ── Health check ──
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Start ──
app.listen(PORT, () => {
    console.log("");
    console.log("  ◈ STARK·WEBB BACKEND ◈");
    console.log(`  → Server running on http://localhost:${PORT}`);
    console.log(`  → API: http://localhost:${PORT}/api/projects`);
    console.log("");
});

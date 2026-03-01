// ═══════════════════════════════════════════════════
// UPLOAD ROUTES — File Upload & Management
// ═══════════════════════════════════════════════════

import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pool from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.originalname}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
    fileFilter: (req, file, cb) => {
        const allowed = [
            ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp",
            ".doc", ".docx", ".txt", ".md",
        ];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error(`File type ${ext} not allowed`));
    },
});

const router = Router();

function isAdmin(req) {
    return req.session?.role === "admin";
}

// ── POST /api/projects/:id/docs — Upload file(s) ──
router.post("/:id/docs", upload.array("files", 5), async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT user_id, docs FROM projects WHERE id = $1", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "Project not found" });

        const ownerUserId = rows[0].user_id;
        if (!isAdmin(req) && ownerUserId !== req.session.userId) {
            return res.status(403).json({ error: "Read-only access: uploads are disabled for this project" });
        }

        const existingDocs = rows[0].docs || [];
        const newDocs = req.files.map((file) => ({
            id: Math.random().toString(36).slice(2, 10),
            name: file.originalname,
            type: file.mimetype,
            size: file.size,
            path: `/uploads/${file.filename}`,
            uploadedAt: new Date().toISOString(),
        }));

        const allDocs = [...existingDocs, ...newDocs];

        if (isAdmin(req)) {
            await pool.query(
                "UPDATE projects SET docs = $1, updated_at = NOW() WHERE id = $2",
                [JSON.stringify(allDocs), req.params.id]
            );
        } else {
            await pool.query(
                "UPDATE projects SET docs = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3",
                [JSON.stringify(allDocs), req.params.id, req.session.userId]
            );
        }

        res.status(201).json(newDocs);
    } catch (err) {
        console.error("POST /api/projects/:id/docs error:", err.message);
        res.status(500).json({ error: "Failed to upload files" });
    }
});

// ── DELETE /api/projects/:id/docs/:docId — Remove a doc ──
router.delete("/:id/docs/:docId", async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT user_id, docs FROM projects WHERE id = $1", [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: "Project not found" });

        const ownerUserId = rows[0].user_id;
        if (!isAdmin(req) && ownerUserId !== req.session.userId) {
            return res.status(403).json({ error: "Read-only access: uploads are disabled for this project" });
        }

        const docs = rows[0].docs || [];
        const doc = docs.find((d) => d.id === req.params.docId);

        // Delete file from disk
        if (doc?.path) {
            const filePath = path.join(UPLOADS_DIR, path.basename(doc.path));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        const updatedDocs = docs.filter((d) => d.id !== req.params.docId);
        if (isAdmin(req)) {
            await pool.query(
                "UPDATE projects SET docs = $1, updated_at = NOW() WHERE id = $2",
                [JSON.stringify(updatedDocs), req.params.id]
            );
        } else {
            await pool.query(
                "UPDATE projects SET docs = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3",
                [JSON.stringify(updatedDocs), req.params.id, req.session.userId]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error("DELETE /api/projects/:id/docs/:docId error:", err.message);
        res.status(500).json({ error: "Failed to delete doc" });
    }
});

export default router;

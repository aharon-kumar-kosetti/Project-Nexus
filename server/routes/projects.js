// ═══════════════════════════════════════════════════
// PROJECT ROUTES — CRUD API for Projects
// ═══════════════════════════════════════════════════

import { Router } from "express";
import pool from "../db.js";

const router = Router();

function isAdmin(req) {
    return req.session?.role === "admin";
}

// ── Helper: convert DB row → frontend-friendly object ──
function rowToProject(row) {
    return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        progress: row.progress,
        tags: row.tags || [],
        techStack: row.tech_stack || [],
        repoLink: row.repo_link,
        deployLink: row.deploy_link,
        deployStatus: row.deploy_status,
        deployLabel: row.deploy_label,
        docs: row.docs || [],
        deadline: row.deadline ? row.deadline.toISOString().slice(0, 10) : "",
        createdAt: row.created_at ? row.created_at.toISOString().slice(0, 10) : "",
        tasks: row.tasks || [],
        notes: row.notes,
        activityLog: row.activity_log || [],
    };
}

router.get("/users", async (req, res) => {
    if (!isAdmin(req)) {
        return res.status(403).json({ error: "Admin access required" });
    }

    try {
        const { rows } = await pool.query(
            `SELECT
                u.user_id,
                u.display_name,
                u.role,
                u.created_at,
                COUNT(p.id) AS project_count
             FROM users u
             LEFT JOIN projects p ON p.user_id = u.user_id
             GROUP BY u.user_id, u.display_name, u.role, u.created_at
             ORDER BY u.created_at DESC`
        );

        return res.json(
            rows.map((row) => ({
                userId: row.user_id,
                displayName: row.display_name || row.user_id,
                role: row.role,
                createdAt: row.created_at,
                projectCount: Number(row.project_count || 0),
            }))
        );
    } catch (err) {
        console.error("GET /api/projects/users error:", err.message);
        return res.status(500).json({ error: "Failed to fetch users" });
    }
});

// ── GET /api/projects — Fetch all ──
router.get("/", async (req, res) => {
    try {
        const viewAll = req.query?.all === "true";
        let rows;

        if (isAdmin(req) && viewAll) {
            ({ rows } = await pool.query("SELECT * FROM projects ORDER BY created_at DESC"));
        } else {
            ({ rows } = await pool.query(
                "SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC",
                [req.session.userId]
            ));
        }

        res.json(rows.map(rowToProject));
    } catch (err) {
        console.error("GET /api/projects error:", err.message);
        res.status(500).json({ error: "Failed to fetch projects" });
    }
});

// ── GET /api/projects/:id — Fetch one ──
router.get("/:id", async (req, res) => {
    try {
        let rows;
        if (isAdmin(req)) {
            ({ rows } = await pool.query("SELECT * FROM projects WHERE id = $1", [req.params.id]));
        } else {
            ({ rows } = await pool.query(
                "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
                [req.params.id, req.session.userId]
            ));
        }

        if (rows.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(rowToProject(rows[0]));
    } catch (err) {
        console.error("GET /api/projects/:id error:", err.message);
        res.status(500).json({ error: "Failed to fetch project" });
    }
});

// ── POST /api/projects — Create ──
router.post("/", async (req, res) => {
    try {
        const p = req.body;
        const ownerUserId = isAdmin(req) && p.userId ? p.userId : req.session.userId;
        const { rows } = await pool.query(
            `INSERT INTO projects (
        id, user_id, title, description, status, priority, progress,
        tags, tech_stack, repo_link, deploy_link, deploy_status, deploy_label,
        docs, deadline, created_at, tasks, notes, activity_log
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19
      ) RETURNING *`,
            [
                p.id,
                ownerUserId,
                p.title,
                p.description || "",
                p.status || "Upcoming",
                p.priority || "Medium",
                p.progress || 0,
                JSON.stringify(p.tags || []),
                JSON.stringify(p.techStack || []),
                p.repoLink || "",
                p.deployLink || "",
                p.deployStatus || "not-deployed",
                p.deployLabel || "",
                JSON.stringify(p.docs || []),
                p.deadline || null,
                p.createdAt || new Date().toISOString().slice(0, 10),
                JSON.stringify(p.tasks || []),
                p.notes || "",
                JSON.stringify(p.activityLog || []),
            ]
        );
        res.status(201).json(rowToProject(rows[0]));
    } catch (err) {
        console.error("POST /api/projects error:", err.message);
        res.status(500).json({ error: "Failed to create project" });
    }
});

// ── PUT /api/projects/:id — Update ──
router.put("/:id", async (req, res) => {
    try {
        const p = req.body;
        const updateFields = `UPDATE projects SET
        title = $1, description = $2, status = $3, priority = $4,
        progress = $5, tags = $6, tech_stack = $7, repo_link = $8,
        deploy_link = $9, deploy_status = $10, deploy_label = $11,
        docs = $12, deadline = $13, tasks = $14, notes = $15,
        activity_log = $16, updated_at = NOW()`;

        let rows;
        if (isAdmin(req)) {
            ({ rows } = await pool.query(
                `${updateFields} WHERE id = $17 RETURNING *`,
                [
                    p.title,
                    p.description || "",
                    p.status || "Upcoming",
                    p.priority || "Medium",
                    p.progress || 0,
                    JSON.stringify(p.tags || []),
                    JSON.stringify(p.techStack || []),
                    p.repoLink || "",
                    p.deployLink || "",
                    p.deployStatus || "not-deployed",
                    p.deployLabel || "",
                    JSON.stringify(p.docs || []),
                    p.deadline || null,
                    JSON.stringify(p.tasks || []),
                    p.notes || "",
                    JSON.stringify(p.activityLog || []),
                    req.params.id,
                ]
            ));
        } else {
            ({ rows } = await pool.query(
                `${updateFields} WHERE id = $17 AND user_id = $18 RETURNING *`,
                [
                    p.title,
                    p.description || "",
                    p.status || "Upcoming",
                    p.priority || "Medium",
                    p.progress || 0,
                    JSON.stringify(p.tags || []),
                    JSON.stringify(p.techStack || []),
                    p.repoLink || "",
                    p.deployLink || "",
                    p.deployStatus || "not-deployed",
                    p.deployLabel || "",
                    JSON.stringify(p.docs || []),
                    p.deadline || null,
                    JSON.stringify(p.tasks || []),
                    p.notes || "",
                    JSON.stringify(p.activityLog || []),
                    req.params.id,
                    req.session.userId,
                ]
            ));
        }

        if (rows.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(rowToProject(rows[0]));
    } catch (err) {
        console.error("PUT /api/projects/:id error:", err.message);
        res.status(500).json({ error: "Failed to update project" });
    }
});

// ── DELETE /api/projects/:id — Delete ──
router.delete("/:id", async (req, res) => {
    try {
        let rowCount = 0;

        if (isAdmin(req)) {
            ({ rowCount } = await pool.query("DELETE FROM projects WHERE id = $1", [req.params.id]));
        } else {
            ({ rowCount } = await pool.query(
                "DELETE FROM projects WHERE id = $1 AND user_id = $2",
                [req.params.id, req.session.userId]
            ));
        }

        if (rowCount === 0) return res.status(404).json({ error: "Not found" });
        res.json({ success: true });
    } catch (err) {
        console.error("DELETE /api/projects/:id error:", err.message);
        res.status(500).json({ error: "Failed to delete project" });
    }
});

export default router;

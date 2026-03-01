// ═══════════════════════════════════════════════════
// PROJECT ROUTES — CRUD API for Projects
// ═══════════════════════════════════════════════════

import { Router } from "express";
import pool from "../db.js";

const router = Router();

function isAdmin(req) {
    return req.session?.role === "admin";
}

async function getProjectOwner(projectId) {
    const { rows } = await pool.query("SELECT id, user_id FROM projects WHERE id = $1", [projectId]);
    if (rows.length === 0) return null;
    return rows[0];
}

function canManageProjectAccess(req, projectOwnerUserId) {
    return isAdmin(req) || req.session?.userId === projectOwnerUserId;
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
        readOnly: Boolean(row.read_only),
        accessMode: row.access_mode || "owner",
        sharedByUserId: row.shared_by_user_id || null,
        sharedAt: row.shared_at || null,
    };
}

router.get("/users/search", async (req, res) => {
    const rawSearch = String(req.query?.userId || "").trim();
    const search = rawSearch.toLowerCase();
    const projectId = String(req.query?.projectId || "").trim();

    if (!projectId) {
        return res.status(400).json({ error: "projectId is required" });
    }

    if (!search) {
        return res.json([]);
    }

    try {
        const project = await getProjectOwner(projectId);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        if (!canManageProjectAccess(req, project.user_id)) {
            return res.status(403).json({ error: "Not allowed to manage access for this project" });
        }

        const { rows } = await pool.query(
            `SELECT
                u.user_id,
                u.display_name,
                u.role,
                EXISTS (
                    SELECT 1
                    FROM project_access pa
                    WHERE pa.project_id = $1 AND pa.user_id = u.user_id
                ) AS has_access
             FROM users u
             WHERE LOWER(u.user_id) LIKE $2
               AND u.user_id <> $3
             ORDER BY u.user_id ASC
             LIMIT 10`,
            [projectId, `${search}%`, project.user_id]
        );

        return res.json(
            rows.map((row) => ({
                userId: row.user_id,
                displayName: row.display_name || row.user_id,
                role: row.role,
                hasAccess: Boolean(row.has_access),
            }))
        );
    } catch (err) {
        console.error("GET /api/projects/users/search error:", err.message);
        return res.status(500).json({ error: "Failed to search users" });
    }
});

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

router.get("/shared", async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT
                p.*,
                TRUE AS read_only,
                'shared'::text AS access_mode,
                pa.granted_by_user_id AS shared_by_user_id,
                pa.created_at AS shared_at
             FROM project_access pa
             INNER JOIN projects p ON p.id = pa.project_id
             WHERE pa.user_id = $1
             ORDER BY pa.created_at DESC`,
            [req.session.userId]
        );

        return res.json(rows.map(rowToProject));
    } catch (err) {
        console.error("GET /api/projects/shared error:", err.message);
        return res.status(500).json({ error: "Failed to fetch shared projects" });
    }
});

// ── GET /api/projects — Fetch all ──
router.get("/", async (req, res) => {
    try {
        const viewAll = req.query?.all === "true";
        let rows;

        if (isAdmin(req) && viewAll) {
            ({ rows } = await pool.query(
                `SELECT
                    p.*,
                    FALSE AS read_only,
                    'admin'::text AS access_mode,
                    NULL::varchar(100) AS shared_by_user_id,
                    NULL::timestamptz AS shared_at
                 FROM projects p
                 ORDER BY p.created_at DESC`
            ));
        } else {
            ({ rows } = await pool.query(
                `SELECT
                    p.*,
                    FALSE AS read_only,
                    'owner'::text AS access_mode,
                    NULL::varchar(100) AS shared_by_user_id,
                    NULL::timestamptz AS shared_at
                 FROM projects p
                 WHERE p.user_id = $1
                 ORDER BY p.created_at DESC`,
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
        const { rows } = await pool.query(
            `SELECT
                p.*,
                CASE
                    WHEN $3::boolean THEN FALSE
                    WHEN p.user_id = $2 THEN FALSE
                    WHEN pa.user_id IS NOT NULL THEN TRUE
                    ELSE FALSE
                END AS read_only,
                CASE
                    WHEN $3::boolean THEN 'admin'
                    WHEN p.user_id = $2 THEN 'owner'
                    WHEN pa.user_id IS NOT NULL THEN 'shared'
                    ELSE 'owner'
                END AS access_mode,
                pa.granted_by_user_id AS shared_by_user_id,
                pa.created_at AS shared_at
             FROM projects p
             LEFT JOIN project_access pa
               ON pa.project_id = p.id
              AND pa.user_id = $2
             WHERE p.id = $1
               AND (
                    $3::boolean = TRUE
                    OR p.user_id = $2
                    OR pa.user_id IS NOT NULL
               )
             LIMIT 1`,
            [req.params.id, req.session.userId, isAdmin(req)]
        );

        if (rows.length === 0) return res.status(404).json({ error: "Not found" });
        res.json(rowToProject(rows[0]));
    } catch (err) {
        console.error("GET /api/projects/:id error:", err.message);
        res.status(500).json({ error: "Failed to fetch project" });
    }
});

router.get("/:id/access", async (req, res) => {
    try {
        const project = await getProjectOwner(req.params.id);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        if (!canManageProjectAccess(req, project.user_id)) {
            return res.status(403).json({ error: "Not allowed to view access for this project" });
        }

        const { rows } = await pool.query(
            `SELECT
                pa.user_id,
                u.display_name,
                u.role,
                pa.access_level,
                pa.granted_by_user_id,
                pa.created_at
             FROM project_access pa
             INNER JOIN users u ON u.user_id = pa.user_id
             WHERE pa.project_id = $1
             ORDER BY pa.created_at DESC`,
            [req.params.id]
        );

        return res.json(
            rows.map((row) => ({
                userId: row.user_id,
                displayName: row.display_name || row.user_id,
                role: row.role,
                accessLevel: row.access_level,
                grantedByUserId: row.granted_by_user_id,
                grantedAt: row.created_at,
            }))
        );
    } catch (err) {
        console.error("GET /api/projects/:id/access error:", err.message);
        return res.status(500).json({ error: "Failed to fetch project access list" });
    }
});

router.post("/:id/access", async (req, res) => {
    const userId = String(req.body?.userId || "").trim();
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const project = await getProjectOwner(req.params.id);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        if (!canManageProjectAccess(req, project.user_id)) {
            return res.status(403).json({ error: "Not allowed to manage access for this project" });
        }

        if (userId === project.user_id) {
            return res.status(400).json({ error: "Project owner already has full access" });
        }

        const targetUser = await pool.query("SELECT user_id FROM users WHERE user_id = $1", [userId]);
        if (targetUser.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const { rows } = await pool.query(
            `INSERT INTO project_access (project_id, user_id, access_level, granted_by_user_id)
             VALUES ($1, $2, 'read', $3)
             ON CONFLICT (project_id, user_id) DO NOTHING
             RETURNING project_id, user_id, access_level, granted_by_user_id, created_at`,
            [req.params.id, userId, req.session.userId]
        );

        if (rows.length === 0) {
            return res.status(409).json({ error: "User already has access to this project" });
        }

        return res.status(201).json({
            projectId: rows[0].project_id,
            userId: rows[0].user_id,
            accessLevel: rows[0].access_level,
            grantedByUserId: rows[0].granted_by_user_id,
            grantedAt: rows[0].created_at,
        });
    } catch (err) {
        console.error("POST /api/projects/:id/access error:", err.message);
        return res.status(500).json({ error: "Failed to grant project access" });
    }
});

router.delete("/:id/access/:userId", async (req, res) => {
    const targetUserId = String(req.params.userId || "").trim();
    if (!targetUserId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const project = await getProjectOwner(req.params.id);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        if (!canManageProjectAccess(req, project.user_id)) {
            return res.status(403).json({ error: "Not allowed to manage access for this project" });
        }

        const { rowCount } = await pool.query(
            "DELETE FROM project_access WHERE project_id = $1 AND user_id = $2",
            [req.params.id, targetUserId]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: "Access entry not found" });
        }

        return res.json({ success: true });
    } catch (err) {
        console.error("DELETE /api/projects/:id/access/:userId error:", err.message);
        return res.status(500).json({ error: "Failed to revoke project access" });
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

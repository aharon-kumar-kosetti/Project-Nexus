import { Router } from "express";
import pool from "../db.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

const router = Router();

router.post("/register", async (req, res) => {
    try {
        const { userId, password, displayName } = req.body || {};
        if (!userId || !password) {
            return res.status(400).json({ error: "userId and password are required" });
        }

        const normalizedUserId = String(userId).trim();
        if (!normalizedUserId) {
            return res.status(400).json({ error: "Invalid userId" });
        }

        const { rows: existingUsers } = await pool.query("SELECT user_id FROM users LIMIT 1");
        const role = existingUsers.length === 0 ? "admin" : "user";
        const normalizedDisplayName = String(displayName || normalizedUserId).trim();

        const passwordHash = await hashPassword(password);
        await pool.query(
            `INSERT INTO users (user_id, password_hash, role, display_name)
             VALUES ($1, $2, $3, $4)`,
            [normalizedUserId, passwordHash, role, normalizedDisplayName || normalizedUserId]
        );

        return res.status(201).json({
            created: true,
            userId: normalizedUserId,
            role,
            displayName: normalizedDisplayName || normalizedUserId,
        });
    } catch (err) {
        if (err?.code === "23505") {
            return res.status(409).json({ error: "User already exists" });
        }
        console.error("POST /api/auth/register error:", err.message);
        return res.status(500).json({ error: "Failed to register user" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { userId, password } = req.body || {};

        if (!userId || !password) {
            return res.status(400).json({ error: "userId and password are required" });
        }

        const normalizedUserId = String(userId).trim();
        const { rows } = await pool.query(
            "SELECT user_id, password_hash, role, display_name FROM users WHERE user_id = $1",
            [normalizedUserId]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = rows[0];
        const isValidPassword = await verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        req.session.userId = user.user_id;
        req.session.role = user.role || "user";

        return res.json({
            authenticated: true,
            userId: user.user_id,
            role: req.session.role,
            displayName: user.display_name || user.user_id,
        });
    } catch (err) {
        console.error("POST /api/auth/login error:", err.message);
        return res.status(500).json({ error: "Login failed" });
    }
});

router.get("/me", async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({ authenticated: false });
        }

        const { rows } = await pool.query(
            "SELECT user_id, role, display_name FROM users WHERE user_id = $1",
            [req.session.userId]
        );

        if (rows.length === 0) {
            req.session = null;
            return res.status(401).json({ authenticated: false });
        }

        const user = rows[0];
        req.session.role = user.role || "user";

        return res.json({
            authenticated: true,
            userId: user.user_id,
            role: req.session.role,
            displayName: user.display_name || user.user_id,
        });
    } catch (err) {
        console.error("GET /api/auth/me error:", err.message);
        return res.status(500).json({ error: "Session check failed" });
    }
});

router.post("/admin/users", async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (req.session?.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }

        const { userId, password, displayName, role } = req.body || {};
        if (!userId || !password) {
            return res.status(400).json({ error: "userId and password are required" });
        }

        const normalizedUserId = String(userId).trim();
        const normalizedDisplayName = String(displayName || normalizedUserId).trim() || normalizedUserId;
        const normalizedRole = role === "admin" ? "admin" : "user";

        const passwordHash = await hashPassword(password);
        await pool.query(
            `INSERT INTO users (user_id, password_hash, role, display_name)
             VALUES ($1, $2, $3, $4)`,
            [normalizedUserId, passwordHash, normalizedRole, normalizedDisplayName]
        );

        return res.status(201).json({
            created: true,
            userId: normalizedUserId,
            displayName: normalizedDisplayName,
            role: normalizedRole,
        });
    } catch (err) {
        if (err?.code === "23505") {
            return res.status(409).json({ error: "User already exists" });
        }
        console.error("POST /api/auth/admin/users error:", err.message);
        return res.status(500).json({ error: "Failed to create user" });
    }
});

router.patch("/me/profile", async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { displayName } = req.body || {};
        const normalizedDisplayName = String(displayName || "").trim();
        if (!normalizedDisplayName) {
            return res.status(400).json({ error: "displayName is required" });
        }

        const { rowCount } = await pool.query(
            "UPDATE users SET display_name = $1, updated_at = NOW() WHERE user_id = $2",
            [normalizedDisplayName, req.session.userId]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.json({ updated: true, displayName: normalizedDisplayName });
    } catch (err) {
        console.error("PATCH /api/auth/me/profile error:", err.message);
        return res.status(500).json({ error: "Failed to update profile" });
    }
});

router.patch("/users/:userId/password", async (req, res) => {
    try {
        const actorUserId = req.session?.userId;
        const actorRole = req.session?.role;
        if (!actorUserId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const targetUserId = req.params.userId;
        const { newPassword } = req.body || {};
        if (!newPassword) {
            return res.status(400).json({ error: "newPassword is required" });
        }

        const canChange = actorRole === "admin" || actorUserId === targetUserId;
        if (!canChange) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const passwordHash = await hashPassword(newPassword);
        const { rowCount } = await pool.query(
            "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2",
            [passwordHash, targetUserId]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.json({ updated: true });
    } catch (err) {
        console.error("PATCH /api/auth/users/:userId/password error:", err.message);
        return res.status(500).json({ error: "Failed to update password" });
    }
});

router.post("/logout", (req, res) => {
    if (typeof req.session?.destroy === "function") {
        req.session.destroy(() => {
            res.clearCookie("nexus.sid");
            return res.json({ success: true });
        });
        return;
    }

    req.session = null;
    res.clearCookie("nexus.sid");
    return res.json({ success: true });
});

export default router;

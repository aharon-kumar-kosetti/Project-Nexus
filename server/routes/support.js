import { Router } from "express";
import pool from "../db.js";

const router = Router();

function isAdmin(req) {
    return req.session?.role === "admin";
}

router.get("/messages", async (req, res) => {
    try {
        const actorUserId = req.session?.userId;
        if (!actorUserId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        let rows;
        if (isAdmin(req)) {
            ({ rows } = await pool.query(
                `SELECT
                    sm.id,
                    sm.sender_user_id,
                    sm.message_text,
                    sm.is_read,
                    sm.created_at,
                    u.display_name
                 FROM support_messages sm
                 LEFT JOIN users u ON u.user_id = sm.sender_user_id
                 ORDER BY sm.created_at DESC`
            ));
        } else {
            ({ rows } = await pool.query(
                `SELECT
                    sm.id,
                    sm.sender_user_id,
                    sm.message_text,
                    sm.is_read,
                    sm.created_at,
                    u.display_name
                 FROM support_messages sm
                 LEFT JOIN users u ON u.user_id = sm.sender_user_id
                 WHERE sm.sender_user_id = $1
                 ORDER BY sm.created_at DESC`,
                [actorUserId]
            ));
        }

        return res.json(
            rows.map((row) => ({
                id: row.id,
                senderUserId: row.sender_user_id,
                senderDisplayName: row.display_name || row.sender_user_id,
                messageText: row.message_text,
                isRead: row.is_read,
                createdAt: row.created_at,
            }))
        );
    } catch (err) {
        console.error("GET /api/support/messages error:", err.message);
        return res.status(500).json({ error: "Failed to fetch support messages" });
    }
});

router.post("/messages", async (req, res) => {
    try {
        const actorUserId = req.session?.userId;
        if (!actorUserId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const messageText = String(req.body?.messageText || "").trim();
        if (!messageText) {
            return res.status(400).json({ error: "messageText is required" });
        }

        const { rows } = await pool.query(
            `INSERT INTO support_messages (sender_user_id, message_text)
             VALUES ($1, $2)
             RETURNING id, sender_user_id, message_text, is_read, created_at`,
            [actorUserId, messageText]
        );

        const row = rows[0];
        return res.status(201).json({
            id: row.id,
            senderUserId: row.sender_user_id,
            messageText: row.message_text,
            isRead: row.is_read,
            createdAt: row.created_at,
        });
    } catch (err) {
        console.error("POST /api/support/messages error:", err.message);
        return res.status(500).json({ error: "Failed to send support message" });
    }
});

router.patch("/messages/:id/read", async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!isAdmin(req)) {
            return res.status(403).json({ error: "Admin access required" });
        }

        const messageId = Number(req.params.id);
        if (!Number.isFinite(messageId)) {
            return res.status(400).json({ error: "Invalid message id" });
        }

        const { rowCount } = await pool.query(
            "UPDATE support_messages SET is_read = true WHERE id = $1",
            [messageId]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: "Message not found" });
        }

        return res.json({ updated: true });
    } catch (err) {
        console.error("PATCH /api/support/messages/:id/read error:", err.message);
        return res.status(500).json({ error: "Failed to update message" });
    }
});

export default router;

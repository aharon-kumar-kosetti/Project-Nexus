import { Router } from "express";

const router = Router();

function getAuthConfig() {
    return {
        userId: process.env.AUTH_USER_ID,
        password: process.env.AUTH_PASSWORD,
    };
}

function ensureAuthConfig(res) {
    const auth = getAuthConfig();
    if (!auth.userId || !auth.password) {
        res.status(500).json({ error: "Auth is not configured on server" });
        return null;
    }
    return auth;
}

router.post("/login", (req, res) => {
    const auth = ensureAuthConfig(res);
    if (!auth) return;

    const { userId, password } = req.body || {};

    if (userId !== auth.userId || password !== auth.password) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.userId = auth.userId;
    return res.json({ authenticated: true, userId: auth.userId });
});

router.get("/me", (req, res) => {
    const auth = ensureAuthConfig(res);
    if (!auth) return;

    if (!req.session?.userId || req.session.userId !== auth.userId) {
        return res.status(401).json({ authenticated: false });
    }

    return res.json({ authenticated: true, userId: req.session.userId });
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

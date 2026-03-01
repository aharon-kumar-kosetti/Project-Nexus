export function requireAuth(req, res, next) {
    if (req.session?.userId) {
        return next();
    }
    return res.status(401).json({ error: "Unauthorized" });
}

export function requireAdmin(req, res, next) {
    if (!req.session?.userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.session?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }

    return next();
}

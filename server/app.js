import express from "express";
import cors from "cors";
import cookieSession from "cookie-session";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import uploadRoutes from "./routes/uploads.js";
import supportRoutes from "./routes/support.js";
import { requireAuth } from "./middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const frontendOrigin = process.env.FRONTEND_ORIGIN;

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(
    cors({
        credentials: true,
        origin: frontendOrigin || true,
    })
);
app.use(express.json({ limit: "10mb" }));
app.use(
    cookieSession({
        name: "nexus.sid",
        keys: [process.env.SESSION_SECRET || "change-this-session-secret"],
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    })
);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/projects", requireAuth, projectRoutes);
app.use("/api/projects", requireAuth, uploadRoutes);
app.use("/api/support", requireAuth, supportRoutes);

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;

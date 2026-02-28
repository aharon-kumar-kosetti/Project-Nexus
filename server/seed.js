// ═══════════════════════════════════════════════════
// SEED — 8 Sample Projects matching the UI image
// ═══════════════════════════════════════════════════

import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
const shouldUseSsl =
    process.env.POSTGRES_SSL === "true" ||
    databaseUrl?.includes("neon.tech") ||
    databaseUrl?.includes("neon.database");

if (!databaseUrl) {
    console.error("❌ Missing DATABASE_URL environment variable.");
    console.error("→ Create a .env file from .env.example and set DATABASE_URL.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
});

const PROJECTS = [
    {
        id: "bloodlink",
        title: "Blood Link",
        description: "Blood donation management system connecting donors and recipients in real time.",
        status: "Ongoing",
        priority: "High",
        progress: 80,
        tags: ["healthcare", "community"],
        techStack: ["React", "TypeScript", "Node"],
        repoLink: "https://github.com/example/bloodlink",
        deployLink: "https://bloodlink.vercel.app",
        deployStatus: "live",
        deployLabel: "",
        docs: [],
        deadline: "2026-03-05",
        createdAt: "2026-01-10",
        tasks: [
            { id: "t1", text: "Donor registration flow", done: true },
            { id: "t2", text: "SMS notification system", done: true },
            { id: "t3", text: "Admin dashboard", done: true },
            { id: "t4", text: "Blood type matching algorithm", done: true },
            { id: "t5", text: "Mobile responsive design", done: false },
        ],
        notes: "Live on Vercel. Mobile polish needed before final launch.",
        activityLog: [
            { ts: "2026-01-10T09:00:00Z", action: "Project created" },
            { ts: "2026-02-01T14:22:00Z", action: "Status → Ongoing" },
            { ts: "2026-02-15T10:00:00Z", action: "Deploy → Live" },
        ],
    },
    {
        id: "hlthtrack",
        title: "HealthTrack",
        description: "AI-powered health monitoring app with real-time vitals tracking and alerts.",
        status: "Upcoming",
        priority: "High",
        progress: 60,
        tags: ["ai", "health"],
        techStack: ["React", "Firebase", "MongoDB"],
        repoLink: "https://github.com/example/healthtrack",
        deployLink: "",
        deployStatus: "not-deployed",
        deployLabel: "",
        docs: [],
        deadline: "2026-04-25",
        createdAt: "2026-01-20",
        tasks: [
            { id: "t1", text: "User auth & onboarding", done: true },
            { id: "t2", text: "Vitals dashboard", done: true },
            { id: "t3", text: "AI anomaly detection", done: true },
            { id: "t4", text: "Push notification alerts", done: false },
            { id: "t5", text: "Apple Watch integration", done: false },
        ],
        notes: "AI model training complete. Notifications and wearable sync still pending.",
        activityLog: [
            { ts: "2026-01-20T09:00:00Z", action: "Project created" },
        ],
    },
    {
        id: "edusphere",
        title: "EduSphere",
        description: "Online learning platform with interactive courses, quizzes, and live sessions.",
        status: "Upcoming",
        priority: "Medium",
        progress: 30,
        tags: ["education", "saas"],
        techStack: ["Next.js", "Tailwind", "PostgreSQL"],
        repoLink: "https://github.com/example/edusphere",
        deployLink: "",
        deployStatus: "not-deployed",
        deployLabel: "",
        docs: [],
        deadline: "2026-05-02",
        createdAt: "2026-02-01",
        tasks: [
            { id: "t1", text: "Course creation wizard", done: true },
            { id: "t2", text: "Student dashboard", done: false },
            { id: "t3", text: "Quiz & assessment engine", done: false },
            { id: "t4", text: "Live session (WebRTC)", done: false },
            { id: "t5", text: "Payment integration", done: false },
        ],
        notes: "Course creation MVP done. Large remaining surface area.",
        activityLog: [
            { ts: "2026-02-01T09:00:00Z", action: "Project created" },
        ],
    },
    {
        id: "cybershild",
        title: "CyberShield",
        description: "Security analytics dashboard with real-time threat detection and audit logs.",
        status: "Ongoing",
        priority: "High",
        progress: 45,
        tags: ["security", "analytics"],
        techStack: ["Vue", "Express", "Docker"],
        repoLink: "https://github.com/example/cybershield",
        deployLink: "",
        deployStatus: "custom",
        deployLabel: "Internal Beta",
        docs: [],
        deadline: "2026-04-18",
        createdAt: "2026-01-15",
        tasks: [
            { id: "t1", text: "Threat detection engine", done: true },
            { id: "t2", text: "Audit log viewer", done: true },
            { id: "t3", text: "Role-based access control", done: false },
            { id: "t4", text: "Anomaly alerts (email)", done: false },
            { id: "t5", text: "Docker deployment setup", done: false },
        ],
        notes: "Detection engine complete. RBAC and alerts are blockers.",
        activityLog: [
            { ts: "2026-01-15T09:00:00Z", action: "Project created" },
            { ts: "2026-02-10T11:00:00Z", action: "Status → Ongoing" },
        ],
    },
    {
        id: "shopflow",
        title: "ShopFlow",
        description: "Full-featured e-commerce platform with product management and payment gateway.",
        status: "Completed",
        priority: "High",
        progress: 100,
        tags: ["ecommerce", "saas"],
        techStack: ["React", "Stripe", "AWS"],
        repoLink: "https://github.com/example/shopflow",
        deployLink: "https://shopflow.io",
        deployStatus: "live",
        deployLabel: "",
        docs: [],
        deadline: "2026-03-12",
        createdAt: "2025-11-01",
        tasks: [
            { id: "t1", text: "Product catalog", done: true },
            { id: "t2", text: "Cart & checkout flow", done: true },
            { id: "t3", text: "Stripe payment integration", done: true },
            { id: "t4", text: "Admin panel", done: true },
            { id: "t5", text: "Deploy to AWS", done: true },
        ],
        notes: "Shipped on time. 2000+ active users.",
        activityLog: [
            { ts: "2025-11-01T09:00:00Z", action: "Project created" },
            { ts: "2026-03-12T18:00:00Z", action: "Status → Completed · Deploy → Live" },
        ],
    },
    {
        id: "taskmaster",
        title: "TaskMaster",
        description: "Project collaboration tool with real-time task boards, comments and file sharing.",
        status: "Completed",
        priority: "Medium",
        progress: 100,
        tags: ["productivity", "saas"],
        techStack: ["Angular", "Firebase"],
        repoLink: "https://github.com/example/taskmaster",
        deployLink: "https://taskmaster.app",
        deployStatus: "live",
        deployLabel: "",
        docs: [],
        deadline: "2026-03-05",
        createdAt: "2025-12-01",
        tasks: [
            { id: "t1", text: "Real-time board (Firestore)", done: true },
            { id: "t2", text: "Drag & drop tasks", done: true },
            { id: "t3", text: "File upload & comments", done: true },
            { id: "t4", text: "User invitations", done: true },
        ],
        notes: "Delivered. Considering v2 with video calls.",
        activityLog: [
            { ts: "2025-12-01T09:00:00Z", action: "Project created" },
            { ts: "2026-03-05T12:00:00Z", action: "Status → Completed" },
        ],
    },
    {
        id: "financepro",
        title: "FinancePro",
        description: "Personal finance and expense tracker with budget goals and spending insights.",
        status: "Completed",
        priority: "Medium",
        progress: 100,
        tags: ["finance", "mobile"],
        techStack: ["Flutter", "SQLite"],
        repoLink: "https://github.com/example/financepro",
        deployLink: "https://play.google.com/store/apps",
        deployStatus: "live",
        deployLabel: "",
        docs: [],
        deadline: "2026-02-22",
        createdAt: "2025-10-15",
        tasks: [
            { id: "t1", text: "Expense entry & categories", done: true },
            { id: "t2", text: "Budget goal tracker", done: true },
            { id: "t3", text: "Charts & insights", done: true },
            { id: "t4", text: "Export to CSV", done: true },
        ],
        notes: "Published on Play Store. Working on iOS version next.",
        activityLog: [
            { ts: "2025-10-15T09:00:00Z", action: "Project created" },
            { ts: "2026-02-22T09:00:00Z", action: "Status → Completed · Deploy → Live" },
        ],
    },
    {
        id: "orbitdash",
        title: "OrbitDash",
        description: "Satellite tracking and orbit visualization dashboard for HAM radio operators.",
        status: "Paused",
        priority: "Low",
        progress: 25,
        tags: ["space", "visualization"],
        techStack: ["React", "Three.js", "Node"],
        repoLink: "https://github.com/example/orbitdash",
        deployLink: "",
        deployStatus: "not-deployed",
        deployLabel: "",
        docs: [],
        deadline: "2026-06-01",
        createdAt: "2025-12-20",
        tasks: [
            { id: "t1", text: "3D Earth globe renderer", done: true },
            { id: "t2", text: "TLE orbit parser", done: false },
            { id: "t3", text: "Real-time satellite API", done: false },
            { id: "t4", text: "Pass prediction engine", done: false },
        ],
        notes: "Paused — waiting for N2YO API access and finding time for 3D math.",
        activityLog: [
            { ts: "2025-12-20T09:00:00Z", action: "Project created" },
            { ts: "2026-01-30T09:00:00Z", action: "Status → Paused" },
        ],
    },
];

async function seed() {
    console.log("🌱 Seeding database with sample projects...");
    for (const p of PROJECTS) {
        await pool.query(
            `INSERT INTO projects (
                id, title, description, status, priority, progress,
                tags, tech_stack, repo_link, deploy_link, deploy_status, deploy_label,
                docs, deadline, created_at, tasks, notes, activity_log
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
            ON CONFLICT (id) DO UPDATE SET
                title=EXCLUDED.title, description=EXCLUDED.description,
                status=EXCLUDED.status, priority=EXCLUDED.priority, progress=EXCLUDED.progress,
                tags=EXCLUDED.tags, tech_stack=EXCLUDED.tech_stack, repo_link=EXCLUDED.repo_link,
                deploy_link=EXCLUDED.deploy_link, deploy_status=EXCLUDED.deploy_status,
                deploy_label=EXCLUDED.deploy_label, docs=EXCLUDED.docs,
                deadline=EXCLUDED.deadline, tasks=EXCLUDED.tasks,
                notes=EXCLUDED.notes, activity_log=EXCLUDED.activity_log`,
            [
                p.id, p.title, p.description, p.status, p.priority, p.progress,
                JSON.stringify(p.tags), JSON.stringify(p.techStack),
                p.repoLink, p.deployLink, p.deployStatus, p.deployLabel,
                JSON.stringify(p.docs), p.deadline || null, p.createdAt,
                JSON.stringify(p.tasks), p.notes, JSON.stringify(p.activityLog),
            ]
        );
        console.log(`  ✓ ${p.title}`);
    }
    console.log("✅ Seeding complete!");
    await pool.end();
}

seed().catch((err) => {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
});

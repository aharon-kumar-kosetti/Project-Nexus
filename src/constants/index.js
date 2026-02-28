// ═══════════════════════════════════════════════════
// PROJECT NEXUS — CONSTANTS
// ═══════════════════════════════════════════════════

// ─── Version ─── Update this to bump the displayed version number ───
export const APP_VERSION = "3.0";

export const STATUSES = ["Upcoming", "Ongoing", "Completed", "Paused"];

export const STATUS_CFG = {
    Upcoming: { color: "#00BFFF", glow: "#00BFFF35", tag: "UPCOMING", icon: "◈" },
    Ongoing: { color: "#FF003C", glow: "#FF003C35", tag: "ONGOING", icon: "◉" },
    Completed: { color: "#FFD700", glow: "#FFD70035", tag: "DONE", icon: "◆" },
    Paused: { color: "#AA55FF", glow: "#AA55FF35", tag: "PAUSED", icon: "⏸" },
};

export const PRIORITIES = ["Low", "Medium", "High", "Critical"];

export const PRI_CFG = {
    Low: { color: "#666", bg: "#66666620", label: "LOW" },
    Medium: { color: "#00BFFF", bg: "#00BFFF20", label: "MED" },
    High: { color: "#FFD700", bg: "#FFD70020", label: "HIGH" },
    Critical: { color: "#FF003C", bg: "#FF003C20", label: "CRIT" },
};

export const TECH_LIST = [
    { label: "React", icon: "⚛", color: "#61DAFB" },
    { label: "Next.js", icon: "▲", color: "#ffffff" },
    { label: "Vue", icon: "◈", color: "#42b883" },
    { label: "Angular", icon: "⬡", color: "#DD0031" },
    { label: "Svelte", icon: "◊", color: "#FF3E00" },
    { label: "TypeScript", icon: "TS", color: "#3178C6" },
    { label: "JavaScript", icon: "JS", color: "#F7DF1E" },
    { label: "Python", icon: "Py", color: "#3776AB" },
    { label: "Node.js", icon: "⬡", color: "#539E43" },
    { label: "Express", icon: "Ex", color: "#aaaaaa" },
    { label: "Django", icon: "Dj", color: "#44b78b" },
    { label: "FastAPI", icon: "⚡", color: "#009688" },
    { label: "React Native", icon: "📱", color: "#61DAFB" },
    { label: "Flutter", icon: "Ft", color: "#54C5F8" },
    { label: "TensorFlow", icon: "TF", color: "#FF6F00" },
    { label: "PyTorch", icon: "PT", color: "#EE4C2C" },
    { label: "scikit-learn", icon: "SK", color: "#F7931E" },
    { label: "MongoDB", icon: "Mg", color: "#47A248" },
    { label: "PostgreSQL", icon: "Pg", color: "#336791" },
    { label: "Firebase", icon: "🔥", color: "#FFCA28" },
    { label: "Supabase", icon: "Sb", color: "#3ECF8E" },
    { label: "Docker", icon: "🐳", color: "#2496ED" },
    { label: "AWS", icon: "☁", color: "#FF9900" },
    { label: "Vercel", icon: "▲", color: "#aaaaaa" },
    { label: "Netlify", icon: "Nt", color: "#00C7B7" },
    { label: "HTML/CSS", icon: "🌐", color: "#E34F26" },
    { label: "Tailwind", icon: "~", color: "#38BDF8" },
    { label: "Java", icon: "☕", color: "#007396" },
    { label: "Go", icon: "Go", color: "#00ADD8" },
    { label: "Rust", icon: "⚙", color: "#CE422B" },
    { label: "C++", icon: "C+", color: "#00599C" },
];

export const DEFAULT_PROJECTS = [
    {
        id: "dp1",
        title: "Portfolio Website",
        description: "Personal portfolio showcasing projects & skills. Mobile-first, deployed on Vercel.",
        status: "Ongoing",
        priority: "High",
        progress: 60,
        tags: ["Personal", "Design"],
        techStack: ["React", "Tailwind", "Vercel"],
        repoLink: "https://github.com",
        deployLink: "https://mysite.vercel.app",
        deployStatus: "live",
        deployLabel: "",
        docs: [],
        deadline: "2026-03-15",
        createdAt: "2026-01-10",
        tasks: [
            { id: "t1", text: "Design mockup", done: true },
            { id: "t2", text: "Homepage build", done: true },
            { id: "t3", text: "Projects section", done: false },
            { id: "t4", text: "Deploy & test", done: false },
        ],
        notes: "Focus on animations and mobile experience.",
        activityLog: [
            { ts: "2026-01-10T09:00:00Z", action: "Project created" },
            { ts: "2026-01-14T14:00:00Z", action: "Status → Ongoing" },
        ],
    },
    {
        id: "dp2",
        title: "ML Image Classifier",
        description: "CNN model for CIFAR-10 classification using PyTorch. Research project.",
        status: "Upcoming",
        priority: "Medium",
        progress: 0,
        tags: ["ML", "Research"],
        techStack: ["Python", "PyTorch", "scikit-learn"],
        repoLink: "https://github.com",
        deployLink: "",
        deployStatus: "not-deployed",
        deployLabel: "",
        docs: [],
        deadline: "2026-05-01",
        createdAt: "2026-02-10",
        tasks: [
            { id: "t5", text: "Data preprocessing pipeline", done: false },
            { id: "t6", text: "Model architecture", done: false },
            { id: "t7", text: "Training loop", done: false },
        ],
        notes: "",
        activityLog: [
            { ts: "2026-02-10T10:00:00Z", action: "Project created" },
        ],
    },
];

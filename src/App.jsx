// APP - Main Application Component (Theme-Aware)

import { useState, useEffect } from "react";
import "./App.css";
import { STATUSES, PRIORITIES, APP_VERSION } from "./constants";
import { calcProgress, daysLeft } from "./utils";
import { fetchProjects, createProject, updateProject, deleteProject } from "./api/projects";
import { login, getSession, logout } from "./api/auth";
import { useTheme } from "./context/ThemeContext";
import ProjectCard from "./components/ProjectCard";
import KanbanBoard from "./components/KanbanBoard";
import KanbanColumn from "./components/KanbanColumn";
import Modal from "./components/Modal";

// Dark mode logo (arc-reactor style SVG)
function NexusLogo() {
    return (
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="#2979FF" strokeWidth="1.5" opacity="0.4" />
            <circle cx="18" cy="18" r="13" stroke="#2979FF" strokeWidth="1" opacity="0.6" />
            <circle cx="18" cy="18" r="8" fill="#2979FF" opacity="0.15" />
            <path d="M18 6 A12 12 0 0 1 30 18" stroke="#2979FF" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 30 A12 12 0 0 1 6 18" stroke="#2979FF" strokeWidth="2" strokeLinecap="round" />
            <circle cx="18" cy="18" r="3.5" fill="#2979FF" />
            <circle cx="18" cy="18" r="1.5" fill="#fff" />
        </svg>
    );
}

export default function App() {
    const { theme, toggle } = useTheme();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageLoaded, setPageLoaded] = useState(typeof document !== "undefined" ? document.readyState === "complete" : false);
    const [minSplashPassed, setMinSplashPassed] = useState(false);
    const [modal, setModal] = useState(null);
    const [view, setView] = useState("kanban");
    const [filter, setFilter] = useState("All");
    const sort = "deadline";
    const [search, setSearch] = useState("");
    const [dragId, setDragId] = useState(null);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900);
    const [apiError, setApiError] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);
    const [userIdInput, setUserIdInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");
    const [authError, setAuthError] = useState("");
    const [loginBooting, setLoginBooting] = useState(false);

    const isDark = theme === "dark";

    // Check auth session on app start
    useEffect(() => {
        (async () => {
            try {
                await getSession();
                setIsAuthenticated(true);
            } catch {
                setIsAuthenticated(false);
            } finally {
                setAuthChecking(false);
            }
        })();
    }, []);

    // Load projects once authenticated
    useEffect(() => {
        if (authChecking) return;

        if (!isAuthenticated) {
            setLoading(false);
            setProjects([]);
            return;
        }

        setLoading(true);
        (async () => {
            try {
                const data = await fetchProjects();
                setProjects(data);
                setApiError("");
            } catch (err) {
                console.error("Failed to load projects:", err);
                if (err?.status === 401) {
                    setIsAuthenticated(false);
                    setApiError("");
                } else {
                    setProjects([]);
                    setApiError("Unable to load projects right now. Please refresh or try again in a moment.");
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [authChecking, isAuthenticated]);

    useEffect(() => {
        const timer = setTimeout(() => setMinSplashPassed(true), 900);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (document.readyState === "complete") {
            setPageLoaded(true);
            return;
        }
        const handleLoad = () => setPageLoaded(true);
        window.addEventListener("load", handleLoad);
        return () => window.removeEventListener("load", handleLoad);
    }, []);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 900);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (loginBooting) return;
        setAuthError("");

        if (!userIdInput.trim() || !passwordInput) {
            setAuthError("Enter your ID and password.");
            return;
        }

        try {
            await login(userIdInput.trim(), passwordInput);
            setLoginBooting(true);
            setPasswordInput("");
            setApiError("");
            setTimeout(() => {
                setIsAuthenticated(true);
                setLoginBooting(false);
            }, 1700);
        } catch (err) {
            console.error("Login failed:", err);
            setAuthError(err?.status === 401 ? "Invalid ID or password." : "Login failed. Please try again.");
            setLoginBooting(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error("Logout failed:", err);
        } finally {
            setIsAuthenticated(false);
            setProjects([]);
            setModal(null);
            setApiError("");
            setAuthError("");
            setLoginBooting(false);
        }
    };

    // CRUD handlers
    const handleSave = async (p) => {
        try {
            const exists = projects.find((x) => x.id === p.id);
            if (exists) {
                const updated = await updateProject(p);
                setProjects((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
            } else {
                const created = await createProject(p);
                setProjects((prev) => [...prev, created]);
            }
            setApiError("");
        } catch (err) {
            console.error("Failed to save project:", err);
            if (err?.status === 401) {
                setIsAuthenticated(false);
                setApiError("");
            } else {
                setApiError("Could not save project. Please check your connection and try again.");
            }
        }
        setModal(null);
    };

    const handleDelete = async (id) => {
        if (confirm("Destroy this project?")) {
            try {
                await deleteProject(id);
                setProjects((prev) => prev.filter((p) => p.id !== id));
                setApiError("");
            } catch (err) {
                console.error("Failed to delete project:", err);
                if (err?.status === 401) {
                    setIsAuthenticated(false);
                    setApiError("");
                } else {
                    setApiError("Could not delete project. Please try again.");
                }
            }
            setModal(null);
        }
    };

    // Drag and drop (Kanban)
    const onDragStart = (e, id) => {
        setDragId(id);
        e.dataTransfer.effectAllowed = "move";
    };
    const onDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };
    const onDrop = async (e, status) => {
        e.preventDefault();
        if (!dragId) return;
        const project = projects.find((p) => p.id === dragId);
        if (!project) return;
        const log = [...(project.activityLog || []), { ts: new Date().toISOString(), action: `Status → ${status} (drag)` }];
        const updatedProject = { ...project, status, activityLog: log };
        try {
            const saved = await updateProject(updatedProject);
            setProjects((prev) => prev.map((p) => (p.id === dragId ? saved : p)));
            setApiError("");
        } catch (err) {
            console.error("Failed to update project status:", err);
            if (err?.status === 401) {
                setIsAuthenticated(false);
                setApiError("");
            } else {
                setApiError("Could not update project status. Please try again.");
            }
        }
        setDragId(null);
    };

    // Filter + Sort
    const displayed = projects
        .filter((p) => filter === "All" || p.status === filter)
        .filter(
            (p) =>
                !search ||
                p.title.toLowerCase().includes(search.toLowerCase()) ||
                p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
                p.techStack?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a, b) => {
            if (sort === "deadline") return (a.deadline || "9999") > (b.deadline || "9999") ? 1 : -1;
            if (sort === "priority") return PRIORITIES.indexOf(b.priority) - PRIORITIES.indexOf(a.priority);
            if (sort === "progress") return (calcProgress(b.tasks) ?? b.progress) - (calcProgress(a.tasks) ?? a.progress);
            return 0;
        });

    // Stats
    const stats = {
        total: projects.length,
        ongoing: projects.filter((p) => p.status === "Ongoing").length,
        upcoming: projects.filter((p) => p.status === "Upcoming").length,
        completed: projects.filter((p) => p.status === "Completed").length,
        overdue: projects.filter((p) => p.deadline && daysLeft(p.deadline) < 0 && p.status !== "Completed").length,
    };

    // Loading screen
    if (authChecking || loading || !pageLoaded || !minSplashPassed) {
        return (
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: "100vh", background: isDark ? "#0B0D18" : "#070710",
                color: isDark ? "#2979FF" : "#FF003C",
                fontFamily: isDark ? "'Inter',sans-serif" : "'Orbitron',monospace",
                fontSize: 12, letterSpacing: 2,
            }}>
                {isDark ? "Loading..." : "INITIALIZING STARK·WEBB SYSTEM..."}
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="nexus-login-screen" style={{
                minHeight: "100vh",
                background: "radial-gradient(circle at 20% 20%, #15203d 0%, #0B0D18 35%, #080A14 100%)",
                color: theme === "dark" ? "#E8EAF2" : "#111827",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                fontFamily: "'Inter',sans-serif",
                position: "relative",
                overflow: "hidden",
            }}>
                <div className="jarvis-grid" />
                <form onSubmit={handleLogin} style={{
                    width: "100%",
                    maxWidth: 380,
                    background: "linear-gradient(180deg, rgba(20,24,36,0.95), rgba(11,13,24,0.96))",
                    border: "1px solid #243153",
                    borderRadius: 14,
                    padding: 22,
                    boxShadow: "0 20px 50px rgba(0,0,0,0.55)",
                    position: "relative",
                    zIndex: 2,
                }}>
                    <div style={{ fontSize: 11, color: "#5B9EFF", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                        Stark Industries Access
                    </div>
                    <h1 style={{ margin: "0 0 4px", fontSize: 24, fontFamily: "'Space Grotesk',sans-serif", color: "#E8EAF2" }}>J.A.R.V.I.S. Login</h1>
                    <div style={{ marginBottom: 16, fontSize: 12, color: "#8B91A8", letterSpacing: "0.04em" }}>Authenticate as Tony Stark</div>

                    <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#8B91A8" }}>ID</label>
                    <input
                        value={userIdInput}
                        onChange={(e) => setUserIdInput(e.target.value)}
                        autoComplete="username"
                        placeholder="tony.stark"
                        disabled={loginBooting}
                        style={{ width: "100%", boxSizing: "border-box", marginBottom: 12, background: "#0B0D18", border: "1px solid #1E2740", borderRadius: 8, color: "#E8EAF2", padding: "10px 12px", fontSize: 13, outline: "none" }}
                    />

                    <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#8B91A8" }}>Password</label>
                    <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        autoComplete="current-password"
                        placeholder="Enter password"
                        disabled={loginBooting}
                        style={{ width: "100%", boxSizing: "border-box", marginBottom: 14, background: "#0B0D18", border: "1px solid #1E2740", borderRadius: 8, color: "#E8EAF2", padding: "10px 12px", fontSize: 13, outline: "none" }}
                    />

                    {authError && (
                        <div style={{ marginBottom: 12, fontSize: 12, color: "#FF7B7B" }}>{authError}</div>
                    )}

                    <button type="submit" disabled={loginBooting} style={{ width: "100%", background: loginBooting ? "#1E2740" : "#2979FF", color: "#fff", border: "none", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontWeight: 600, cursor: loginBooting ? "not-allowed" : "pointer" }}>
                        {loginBooting ? "Initializing J.A.R.V.I.S..." : "Login as Tony Stark"}
                    </button>

                    {loginBooting && (
                        <div className="jarvis-boot-sequence">
                            <div className="jarvis-ring jarvis-ring-outer" />
                            <div className="jarvis-ring jarvis-ring-inner" />
                            <div className="jarvis-pulse-core" />
                            <div className="jarvis-scan-line" />
                            <div className="jarvis-boot-text">J.A.R.V.I.S ONLINE · ACCESS GRANTED</div>
                        </div>
                    )}
                </form>
            </div>
        );
    }

    const errorBanner = apiError ? (
        <div style={{
            margin: isDark ? (isMobile ? "10px 12px 0" : "10px 24px 0") : (isMobile ? "10px 14px 0" : "10px 24px 0"),
            background: isDark ? "rgba(255,75,75,0.12)" : "#FEF2F2",
            border: `1px solid ${isDark ? "rgba(255,75,75,0.35)" : "#FECACA"}`,
            color: isDark ? "#FF7B7B" : "#B91C1C",
            borderRadius: 10,
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            fontSize: 13,
            fontFamily: "'Inter',sans-serif",
        }}>
            <span>{apiError}</span>
            <button
                type="button"
                onClick={() => setApiError("")}
                style={{
                    background: "none",
                    border: "none",
                    color: "inherit",
                    cursor: "pointer",
                    fontSize: 16,
                    lineHeight: 1,
                    padding: 0,
                }}
            >
                ✕
            </button>
        </div>
    ) : null;

    // Dark mode - clean design
    if (isDark) {
        return (
            <div data-nexus-theme="dark" style={{
                minHeight: "100vh",
                background: "#0B0D18",
                color: "#E8EAF2",
                fontFamily: "'Inter', sans-serif",
                overflowX: "hidden",
            }}>
                {/* Header */}
                <header style={{
                    display: "flex",
                    alignItems: "center",
                    padding: isMobile ? "12px 12px" : "14px 24px",
                    borderBottom: "1px solid #1E2740",
                    background: "#0B0D18",
                    position: "sticky", top: 0, zIndex: 100,
                    gap: 10,
                    flexWrap: "wrap",
                }}>
                    <NexusLogo />
                    <div style={{ marginRight: isMobile ? 0 : "auto", marginLeft: 8, width: isMobile ? "calc(100% - 48px)" : "auto" }}>
                        <span style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            color: "#E8EAF2",
                            textTransform: "uppercase",
                            display: "block",
                        }}>
                            Project Nexus
                        </span>
                        <span style={{ fontSize: 10, color: "#4A5170", fontFamily: "'Inter', sans-serif", letterSpacing: "0.05em" }}>
                            v{APP_VERSION}
                        </span>
                    </div>

                    {/* Search */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: "#141824", border: "1px solid #1E2740",
                        borderRadius: 8, padding: "8px 14px",
                        width: isMobile ? "100%" : "auto",
                    }}>
                        <span style={{ color: "#4A5170", fontSize: 14 }}>{"\u2315"}</span>
                        <input
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search"
                            style={{
                                background: "none", border: "none", outline: "none",
                                color: "#E8EAF2", fontSize: 13, fontFamily: "'Inter', sans-serif",
                                width: isMobile ? "100%" : 160,
                            }}
                        />
                    </div>

                    {/* View toggle - active button highlighted */}
                    <div style={{ display: "flex", gap: 2, background: "#141824", border: "1px solid #1E2740", borderRadius: 8, padding: 3 }}>
                        {[["kanban", "Kanban"], ["grid", "Grid"]].map(([v, l]) => (
                            <button key={v} onClick={() => setView(v)} style={{
                                background: view === v ? "#2979FF" : "none",
                                border: view === v ? "none" : "1px solid transparent",
                                color: view === v ? "#fff" : "#4A5170",
                                borderRadius: 6, padding: "6px 16px", cursor: "pointer",
                                fontSize: 12, fontFamily: "'Inter', sans-serif",
                                fontWeight: view === v ? 600 : 400,
                                transition: "all 0.15s",
                                letterSpacing: view === v ? "0.01em" : 0,
                            }}>
                                {l}
                            </button>
                        ))}
                    </div>

                    {/* New Mission */}
                    <button onClick={() => setModal("new")} style={{
                        background: "#2979FF", border: "none", color: "#fff",
                        borderRadius: 8, padding: "9px 18px", cursor: "pointer",
                        fontSize: 13, fontFamily: "'Inter', sans-serif", fontWeight: 600,
                        transition: "all 0.15s",
                    }}
                        onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.12)"}
                        onMouseLeave={e => e.currentTarget.style.filter = "brightness(1)"}
                    >
                        + New Mission
                    </button>

                    <button onClick={handleLogout} title="Logout" style={{
                        background: "#141824", border: "1px solid #1E2740",
                        borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                        color: "#FF7B7B", fontSize: 12, transition: "all 0.15s",
                        fontFamily: "'Inter', sans-serif", fontWeight: 600,
                    }}>
                        Logout
                    </button>

                    {/* Theme toggle */}
                    <button onClick={toggle} title="Switch to Light Mode" style={{
                        background: "#141824", border: "1px solid #1E2740",
                        borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                        color: "#8B91A8", fontSize: 14, transition: "all 0.15s",
                        marginLeft: isMobile ? "auto" : 0,
                    }}>
                        {"\u2600\uFE0F"}
                    </button>
                </header>

                {errorBanner}

                {/* Stats + filters row */}
                <div style={{
                    padding: isMobile ? "10px 12px" : "10px 24px",
                    borderBottom: "1px solid #1E2740",
                    display: "flex", alignItems: "center", gap: 20,
                    fontSize: 14, color: "#8B91A8",
                    fontFamily: "'Inter', sans-serif",
                    flexWrap: "wrap",
                }}>
                    <span>Total: <strong style={{ color: "#E8EAF2", fontFamily: "'Space Grotesk', sans-serif", fontSize: 15 }}>{stats.total}</strong></span>
                    <span>Ongoing: <strong style={{ color: "#2979FF", fontFamily: "'Space Grotesk', sans-serif", fontSize: 15 }}>{stats.ongoing}</strong></span>
                    <span>Done: <strong style={{ color: "#00C896", fontFamily: "'Space Grotesk', sans-serif", fontSize: 15 }}>{stats.completed}</strong></span>
                    {stats.overdue > 0 && (
                        <span>Overdue: <strong style={{ color: "#FF4B4B", fontFamily: "'Space Grotesk', sans-serif", fontSize: 15 }}>{stats.overdue}</strong></span>
                    )}

                    {/* Filter pills */}
                    <div style={{ marginLeft: isMobile ? 0 : "auto", display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {["All", ...STATUSES].map((s) => (
                            <button key={s} onClick={() => setFilter(s)} style={{
                                background: filter === s ? "#1E2740" : "none",
                                border: "1px solid",
                                borderColor: filter === s ? "#2979FF" : "#1E2740",
                                color: filter === s ? "#E8EAF2" : "#4A5170",
                                borderRadius: 6, padding: "4px 12px", cursor: "pointer",
                                fontSize: 12, fontFamily: "'Inter', sans-serif",
                                fontWeight: filter === s ? 600 : 400,
                                transition: "all 0.15s",
                            }}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Kanban / Grid */}
                <div style={{ padding: isMobile ? "0 0 24px" : "0 0 64px" }}>
                    {view === "kanban" && (
                        <KanbanBoard
                            projects={displayed}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onProjectClick={setModal}
                            onDragStart={onDragStart}
                            theme={theme}
                            isMobile={isMobile}
                        />
                    )}
                    {view === "grid" && (
                        displayed.length === 0 ? (
                            <div style={{ textAlign: "center", padding: isMobile ? "56px 16px" : "80px 32px", color: "#4A5170", fontFamily: "'Inter',sans-serif" }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>{"\u25CB"}</div>
                                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif", color: "#8B91A8", marginBottom: 4 }}>No missions found</div>
                                <div style={{ fontSize: 13 }}>Click + New Mission to get started</div>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(300px,1fr))", gap: 14, padding: isMobile ? "14px" : "24px 32px" }}>
                                {displayed.map((p) => (
                                    <ProjectCard key={p.id} project={p} onClick={setModal} onDragStart={onDragStart} theme={theme} />
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* Modal */}
                {modal && (
                    <Modal
                        project={modal === "new" ? null : modal}
                        onClose={() => setModal(null)}
                        onSave={handleSave}
                        onDelete={handleDelete}
                        theme={theme}
                    />
                )}
            </div>
        );
    }

    // Light mode - clean sidebar + kanban
    const NAV_ITEMS = [
        { label: "All Projects", key: "All", icon: "\u25A6", count: stats.total },
        { label: "Upcoming", key: "Upcoming", icon: "\u23F0", count: stats.upcoming },
        { label: "Ongoing", key: "Ongoing", icon: "\u26A1", count: stats.ongoing },
        { label: "Done", key: "Completed", icon: "\u2713", count: stats.completed },
        { label: "Paused", key: "Paused", icon: "\u23F8", count: projects.filter(p => p.status === "Paused").length },
    ];

    return (
        <div data-nexus-theme="light" style={{ display: "flex", flexDirection: isMobile ? "column" : "row", minHeight: "100vh", background: "#F0F2F5", fontFamily: "'Inter',sans-serif", overflowX: "hidden" }}>

            {/* Sidebar */}
            <aside style={{ width: isMobile ? "100%" : 220, minWidth: isMobile ? 0 : 220, background: "#FFFFFF", borderRight: isMobile ? "none" : "1px solid #E5E7EB", borderBottom: isMobile ? "1px solid #E5E7EB" : "none", display: "flex", flexDirection: "column", position: isMobile ? "relative" : "sticky", top: 0, height: isMobile ? "auto" : "100vh", overflowY: "auto", flexShrink: 0, zIndex: 50 }}>

                {/* Logo */}
                <div style={{ padding: "22px 20px 16px", borderBottom: "1px solid #F3F4F6" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Triangle logo matching image */}
                        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                            <path d="M16 4L28 26H4L16 4Z" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinejoin="round" />
                            <circle cx="16" cy="16" r="4" fill="#2563EB" opacity="0.7" />
                        </svg>
                        <div>
                            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 800, color: "#111827", letterSpacing: "0.02em" }}>PROJECT </span>
                            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 800, color: "#2563EB", letterSpacing: "0.02em" }}>NEXUS</span>
                        </div>
                    </div>
                </div>

                {/* + New Mission button */}
                <div style={{ padding: "14px 16px 10px" }}>
                    <button
                        onClick={() => setModal("new")}
                        style={{ width: "100%", background: "#2563EB", border: "none", color: "#fff", borderRadius: 10, padding: "11px 0", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.15s", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#1D4ED8"}
                        onMouseLeave={e => e.currentTarget.style.background = "#2563EB"}
                    >
                        + New Mission
                    </button>
                </div>

                {/* Nav links */}
                <nav style={{ padding: "6px 10px", flex: 1, display: isMobile ? "grid" : "block", gridTemplateColumns: isMobile ? "1fr 1fr" : "none", gap: isMobile ? 6 : 0 }}>
                    {NAV_ITEMS.map(({ label, key, icon, count }) => {
                        const isActive = filter === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                style={{
                                    width: "100%", display: "flex", alignItems: "center", gap: 10,
                                    padding: "10px 12px", borderRadius: 8, marginBottom: 2,
                                    background: isActive ? "#EFF6FF" : "none",
                                    border: "none",
                                    borderLeft: isActive ? "3px solid #2563EB" : "3px solid transparent",
                                    cursor: "pointer", transition: "all 0.12s", textAlign: "left",
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#F9FAFB"; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "none"; }}
                            >
                                <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{icon}</span>
                                <span style={{ flex: 1, fontSize: 13.5, fontWeight: isActive ? 600 : 400, color: isActive ? "#2563EB" : "#374151" }}>{label}</span>
                                <span style={{ background: isActive ? "#2563EB" : "#E5E7EB", color: isActive ? "#fff" : "#6B7280", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 600, minWidth: 20, textAlign: "center" }}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                <div style={{ padding: "12px 16px", borderTop: "1px solid #F3F4F6", textAlign: "center", fontSize: 11, color: "#9CA3AF" }}>
                    v{APP_VERSION}
                </div>
            </aside>

            {/* Main content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                {/* Top bar (search + view toggle) */}
                <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E5E7EB", padding: isMobile ? "12px 14px" : "14px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: isMobile ? "wrap" : "nowrap", position: "sticky", top: 0, zIndex: 40 }}>
                    {/* Search */}
                    <div style={{ flex: 1, position: "relative", maxWidth: isMobile ? "100%" : 340, width: isMobile ? "100%" : "auto" }}>
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: 15 }}>{"\uD83D\uDD0D"}</span>
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search projects..."
                            style={{ width: "100%", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 9, color: "#111827", padding: "9px 14px 9px 36px", fontSize: 13, outline: "none", fontFamily: "'Inter',sans-serif", boxSizing: "border-box" }}
                        />
                    </div>

                    {/* View toggle */}
                    <div style={{ display: "flex", gap: 2, background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 8, padding: 3 }}>
                        {[["kanban", "Kanban"], ["grid", "Grid"]].map(([v, l]) => (
                            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? "#FFFFFF" : "none", border: "none", boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.1)" : "none", color: view === v ? "#111827" : "#6B7280", borderRadius: 6, padding: "6px 16px", cursor: "pointer", fontSize: 13, fontFamily: "'Inter',sans-serif", fontWeight: view === v ? 600 : 400, transition: "all 0.12s" }}>
                                {l}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleLogout}
                        title="Logout"
                        style={{
                            background: "#FEF2F2",
                            border: "1px solid #FECACA",
                            borderRadius: 8,
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontSize: 13,
                            color: "#B91C1C",
                            fontFamily: "'Inter',sans-serif",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        Logout
                    </button>

                    <button
                        onClick={toggle}
                        title="Switch to Dark Mode"
                        style={{
                            marginLeft: isMobile ? 0 : "auto",
                            background: "#111827",
                            border: "1px solid #374151",
                            borderRadius: 8,
                            padding: "8px 12px",
                            cursor: "pointer",
                            fontSize: 13,
                            color: "#F9FAFB",
                            fontFamily: "'Inter',sans-serif",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "background 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#1F2937"}
                        onMouseLeave={e => e.currentTarget.style.background = "#111827"}
                    >
                        {"\uD83C\uDF19"} Dark Mode
                    </button>
                </div>

                {errorBanner}

                {/* Stats chips row */}
                <div style={{ padding: isMobile ? "12px 14px 0" : "14px 24px 0", display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[
                        { label: "Total", value: stats.total, icon: "📋", color: "#374151", bg: "#F9FAFB", border: "#E5E7EB" },
                        { label: "Ongoing", value: stats.ongoing, icon: "⚡", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
                        { label: "Done", value: stats.completed, icon: "✅", color: "#059669", bg: "#F0FDF4", border: "#A7F3D0" },
                        ...(stats.overdue > 0 ? [{ label: "Overdue", value: stats.overdue, icon: "⚠️", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" }] : []),
                    ].map(s => (
                        <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 14 }}>{s.icon}</span>
                            <span style={{ fontSize: 13, color: "#6B7280", fontFamily: "'Inter',sans-serif" }}>{s.label}:</span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: s.color, fontFamily: "'Inter',sans-serif" }}>{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* Kanban board */}
                {view === "kanban" && (
                    <div style={{ flex: 1, padding: isMobile ? "12px 8px 18px" : "16px 16px 24px", display: "flex", gap: 0, overflowX: isMobile ? "auto" : "hidden", overflowY: "hidden" }}>
                        {STATUSES.map((status) => {
                            const colProjects = displayed.filter(p => p.status === status);
                            return (
                                <div key={status} style={{ flex: isMobile ? "0 0 290px" : 1, minWidth: isMobile ? 290 : 0, display: "flex", flexDirection: "column", background: "#FFFFFF", borderRadius: 12, margin: "0 6px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
                                    <KanbanColumn
                                        status={status}
                                        projects={colProjects}
                                        onDrop={onDrop}
                                        onDragOver={onDragOver}
                                        onProjectClick={setModal}
                                        onDragStart={onDragStart}
                                        theme={theme}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Grid view */}
                {view === "grid" && (
                    displayed.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "80px 0", color: "#9CA3AF" }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>{"\u25CB"}</div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>No missions found</div>
                            <div style={{ fontSize: 13, marginTop: 4 }}>Click + New Mission to get started</div>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(300px,1fr))", gap: 14, padding: isMobile ? "14px" : "20px 24px" }}>
                            {displayed.map(p => <ProjectCard key={p.id} project={p} onClick={setModal} onDragStart={onDragStart} theme={theme} />)}
                        </div>
                    )
                )}

                {/* Footer */}
                <div style={{ background: "#FFFFFF", borderTop: "1px solid #E5E7EB", padding: isMobile ? "12px 14px" : "12px 24px", display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
                    {[
                        { icon: "\u25A6", label: "Total Projects", value: stats.total },
                        { icon: "\u2714", label: "Active Tasks", value: projects.reduce((acc, p) => acc + (p.tasks?.filter(t => !t.done).length || 0), 0) },
                    ].map(f => (
                        <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 7, color: "#6B7280", fontSize: 13 }}>
                            <span>{f.icon}</span>
                            <span>{f.label}</span>
                            <span style={{ fontWeight: 700, color: "#111827" }}>{f.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {modal && (
                <Modal
                    project={modal === "new" ? null : modal}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    theme={theme}
                />
            )}
        </div>
    );
}

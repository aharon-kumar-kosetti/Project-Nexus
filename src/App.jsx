// APP - Main Application Component (Theme-Aware)

import { useState, useEffect } from "react";
import "./App.css";
import { STATUSES, PRIORITIES, APP_VERSION } from "./constants";
import { calcProgress, daysLeft } from "./utils";
import { fetchProjects, fetchUsers, createProject, updateProject, deleteProject } from "./api/projects";
import { login, getSession, logout, updatePassword, updateProfile, createUserAsAdmin } from "./api/auth";
import { fetchSupportMessages, sendSupportMessage, markSupportMessageRead } from "./api/support";
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
    const [loginMode, setLoginMode] = useState("admin");
    const [authError, setAuthError] = useState("");
    const [loginBooting, setLoginBooting] = useState(false);
    const [sessionUserId, setSessionUserId] = useState("");
    const [sessionDisplayName, setSessionDisplayName] = useState("");
    const [sessionRole, setSessionRole] = useState("user");
    const [users, setUsers] = useState([]);
    const [ownerFilter, setOwnerFilter] = useState("all");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsError, setSettingsError] = useState("");
    const [settingsSuccess, setSettingsSuccess] = useState("");
    const [displayNameForm, setDisplayNameForm] = useState("");
    const [passwordForm, setPasswordForm] = useState("");
    const [newUserId, setNewUserId] = useState("");
    const [newUserDisplayName, setNewUserDisplayName] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [newUserRole, setNewUserRole] = useState("user");
    const [settingsTab, setSettingsTab] = useState("account");
    const [supportMessageForm, setSupportMessageForm] = useState("");
    const [supportMessages, setSupportMessages] = useState([]);

    const isDark = theme === "dark";
    const isAdmin = sessionRole === "admin";
    const unreadSupportCount = supportMessages.filter((message) => !message.isRead).length;

    // Check auth session on app start
    useEffect(() => {
        (async () => {
            try {
                const session = await getSession();
                setSessionUserId(session?.userId || "");
                setSessionDisplayName(session?.displayName || session?.userId || "");
                setSessionRole(session?.role || "user");
                setIsAuthenticated(true);
            } catch {
                setIsAuthenticated(false);
                setSessionUserId("");
                setSessionDisplayName("");
                setSessionRole("user");
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
                const data = await fetchProjects({ all: isAdmin });
                setProjects(data);
                if (isAdmin) {
                    const usersData = await fetchUsers();
                    setUsers(usersData || []);
                } else {
                    setUsers([]);
                }
                setApiError("");
            } catch (err) {
                if (err?.status === 401) {
                    setIsAuthenticated(false);
                    setApiError("");
                    setSessionUserId("");
                    setSessionDisplayName("");
                    setSessionRole("user");
                } else {
                    console.error("Failed to load projects:", err);
                    setProjects([]);
                    setApiError("Unable to load projects right now. Please refresh or try again in a moment.");
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [authChecking, isAuthenticated, isAdmin]);

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

    useEffect(() => {
        setDisplayNameForm(sessionDisplayName || sessionUserId || "");
    }, [sessionDisplayName, sessionUserId]);

    useEffect(() => {
        if (!isAuthenticated || !isAdmin) {
            setSupportMessages([]);
            return;
        }

        let active = true;

        const loadSupportMessages = async () => {
            try {
                const messages = await fetchSupportMessages();
                if (active) {
                    setSupportMessages(messages || []);
                }
            } catch (err) {
                console.error("Failed to refresh support messages:", err);
            }
        };

        loadSupportMessages();
        const intervalId = setInterval(loadSupportMessages, 30000);

        return () => {
            active = false;
            clearInterval(intervalId);
        };
    }, [isAuthenticated, isAdmin]);

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
            const session = await getSession();
            setLoginBooting(true);
            setPasswordInput("");
            setApiError("");
            setTimeout(() => {
                setSessionUserId(session?.userId || userIdInput.trim());
                setSessionDisplayName(session?.displayName || session?.userId || userIdInput.trim());
                setSessionRole(session?.role || "user");
                setIsAuthenticated(true);
                setLoginBooting(false);
            }, 1700);
        } catch (err) {
            console.error("Login failed:", err);
            if (err?.status === 401) {
                setAuthError("Invalid ID or password.");
            } else {
                setAuthError("Login succeeded but session was not saved. Check server cookie settings.");
            }
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
            setSessionUserId("");
            setSessionDisplayName("");
            setSessionRole("user");
            setUsers([]);
            setOwnerFilter("all");
            setSettingsOpen(false);
            setSettingsError("");
            setSettingsSuccess("");
            setDisplayNameForm("");
            setPasswordForm("");
            setNewUserId("");
            setNewUserDisplayName("");
            setNewUserPassword("");
            setNewUserRole("user");
        }
    };

    const openSettings = () => {
        setSettingsOpen(true);
        setSettingsError("");
        setSettingsSuccess("");
        setSettingsTab("account");
        setDisplayNameForm(sessionDisplayName || sessionUserId || "");
        setPasswordForm("");
        setNewUserId("");
        setNewUserDisplayName("");
        setNewUserPassword("");
        setNewUserRole("user");
        setSupportMessageForm("");

        (async () => {
            try {
                const messages = await fetchSupportMessages();
                setSupportMessages(messages || []);
            } catch (err) {
                console.error("Failed to load support messages:", err);
            }
        })();
    };

    const closeSettings = () => {
        setSettingsOpen(false);
        setSettingsError("");
        setSettingsSuccess("");
    };

    const handleChangeName = async (e) => {
        e.preventDefault();
        const value = String(displayNameForm || "").trim();
        if (!value) {
            setSettingsError("Display name cannot be empty.");
            setSettingsSuccess("");
            return;
        }

        try {
            const response = await updateProfile(value);
            setSessionDisplayName(response?.displayName || value);
            if (isAdmin) {
                const usersData = await fetchUsers();
                setUsers(usersData || []);
            }
            setSettingsError("");
            setSettingsSuccess("Name updated.");
        } catch (err) {
            console.error("Failed to update display name:", err);
            setSettingsError(`Could not update name: ${err?.message || "Please try again."}`);
            setSettingsSuccess("");
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        const value = String(passwordForm || "").trim();
        if (!value) {
            setSettingsError("Password cannot be empty.");
            setSettingsSuccess("");
            return;
        }

        try {
            await updatePassword(sessionUserId, value);
            setPasswordForm("");
            setSettingsError("");
            setSettingsSuccess("Password updated.");
        } catch (err) {
            console.error("Failed to update password:", err);
            setSettingsError(`Could not update password: ${err?.message || "Please try again."}`);
            setSettingsSuccess("");
        }
    };

    const handleAdminCreateUser = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;

        const normalizedUserId = String(newUserId || "").trim();
        const normalizedPassword = String(newUserPassword || "").trim();
        const normalizedDisplayName = String(newUserDisplayName || normalizedUserId).trim() || normalizedUserId;

        if (!normalizedUserId) {
            setSettingsError("User ID is required.");
            setSettingsSuccess("");
            return;
        }

        if (!normalizedPassword) {
            setSettingsError("Password is required.");
            setSettingsSuccess("");
            return;
        }

        try {
            await createUserAsAdmin({
                userId: normalizedUserId,
                password: normalizedPassword,
                displayName: normalizedDisplayName,
                role: newUserRole === "admin" ? "admin" : "user",
            });

            const usersData = await fetchUsers();
            setUsers(usersData || []);
            setNewUserId("");
            setNewUserDisplayName("");
            setNewUserPassword("");
            setNewUserRole("user");
            setSettingsError("");
            setSettingsSuccess("User created successfully.");
        } catch (err) {
            console.error("Failed to create user:", err);
            setSettingsError(`Could not create user: ${err?.message || "Please try again."}`);
            setSettingsSuccess("");
        }
    };

    const handleSendSupportMessage = async (e) => {
        e.preventDefault();
        const value = String(supportMessageForm || "").trim();
        if (!value) {
            setSettingsError("Message cannot be empty.");
            setSettingsSuccess("");
            return;
        }

        try {
            await sendSupportMessage(value);
            const messages = await fetchSupportMessages();
            setSupportMessages(messages || []);
            setSupportMessageForm("");
            setSettingsError("");
            setSettingsSuccess("Message sent to admin.");
        } catch (err) {
            console.error("Failed to send support message:", err);
            setSettingsError(`Could not send message: ${err?.message || "Please try again."}`);
            setSettingsSuccess("");
        }
    };

    const handleMarkMessageRead = async (id) => {
        if (!isAdmin) return;
        try {
            await markSupportMessageRead(id);
            const messages = await fetchSupportMessages();
            setSupportMessages(messages || []);
            setSettingsError("");
        } catch (err) {
            console.error("Failed to mark message read:", err);
            setSettingsError(`Could not mark message as read: ${err?.message || "Please try again."}`);
            setSettingsSuccess("");
        }
    };

    // CRUD handlers
    const handleSave = async (p) => {
        try {
            const exists = projects.find((x) => x.id === p.id);
            if (exists) {
                await updateProject(p);
            } else {
                await createProject(p);
            }
            const fresh = await fetchProjects({ all: isAdmin });
            setProjects(fresh);
            setApiError("");
        } catch (err) {
            console.error("Failed to save project:", err);
            if (err?.status === 401) {
                setIsAuthenticated(false);
                setApiError("");
            } else {
                setApiError(`Could not save project: ${err?.message || "Please check your connection and try again."}`);
            }
        }
        setModal(null);
    };

    const handleDelete = async (id) => {
        if (confirm("Destroy this project?")) {
            try {
                await deleteProject(id);
                const fresh = await fetchProjects({ all: isAdmin });
                setProjects(fresh);
                setApiError("");
            } catch (err) {
                console.error("Failed to delete project:", err);
                if (err?.status === 401) {
                    setIsAuthenticated(false);
                    setApiError("");
                } else {
                    setApiError(`Could not delete project: ${err?.message || "Please try again."}`);
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
            await updateProject(updatedProject);
            const fresh = await fetchProjects({ all: isAdmin });
            setProjects(fresh);
            setApiError("");
        } catch (err) {
            console.error("Failed to update project status:", err);
            if (err?.status === 401) {
                setIsAuthenticated(false);
                setApiError("");
            } else {
                setApiError(`Could not update project status: ${err?.message || "Please try again."}`);
            }
        }
        setDragId(null);
    };

    // Filter + Sort
    const displayed = projects
        .filter((p) => !isAdmin || ownerFilter === "all" || p.userId === ownerFilter)
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
        const isAdminLoginMode = loginMode === "admin";
        const accessLabel = isAdminLoginMode ? "Stark Industries Access" : "Avengers Initiative Access";
        const loginTitle = isAdminLoginMode ? "J.A.R.V.I.S. Login" : "A.V.E.N.G.E.R. Login";
        const loginSubtitle = isAdminLoginMode ? "Authenticate as Tony Stark" : "Authenticate as Avenger";
        const idPlaceholder = isAdminLoginMode ? "tony.stark" : "avenger.id";
        const submitLabel = isAdminLoginMode ? "Login as Tony Stark" : "Login as Avenger";
        const bootingLabel = isAdminLoginMode ? "Initializing J.A.R.V.I.S..." : "Initializing Avenger Network...";
        const bootStatus = isAdminLoginMode ? "J.A.R.V.I.S ONLINE · ACCESS GRANTED" : "A.V.E.N.G.E.R ONLINE · ACCESS GRANTED";

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
                        {accessLabel}
                    </div>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 6,
                        background: "#0B0D18",
                        border: "1px solid #1E2740",
                        borderRadius: 8,
                        padding: 4,
                        marginBottom: 12,
                    }}>
                        <button
                            type="button"
                            onClick={() => {
                                setLoginMode("admin");
                                setAuthError("");
                            }}
                            style={{
                                background: isAdminLoginMode ? "#2979FF" : "transparent",
                                border: "none",
                                color: isAdminLoginMode ? "#fff" : "#8B91A8",
                                borderRadius: 6,
                                padding: "7px 8px",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                                fontFamily: "'Inter',sans-serif",
                            }}
                        >
                            Tony Stark (Admin)
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setLoginMode("user");
                                setAuthError("");
                            }}
                            style={{
                                background: !isAdminLoginMode ? "#2979FF" : "transparent",
                                border: "none",
                                color: !isAdminLoginMode ? "#fff" : "#8B91A8",
                                borderRadius: 6,
                                padding: "7px 8px",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                                fontFamily: "'Inter',sans-serif",
                            }}
                        >
                            Avenger (User)
                        </button>
                    </div>

                    <h1 style={{ margin: "0 0 4px", fontSize: 24, fontFamily: "'Space Grotesk',sans-serif", color: "#E8EAF2" }}>{loginTitle}</h1>
                    <div style={{ marginBottom: 16, fontSize: 12, color: "#8B91A8", letterSpacing: "0.04em" }}>{loginSubtitle}</div>

                    <label style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#8B91A8" }}>ID</label>
                    <input
                        value={userIdInput}
                        onChange={(e) => setUserIdInput(e.target.value)}
                        autoComplete="username"
                        placeholder={idPlaceholder}
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
                        {loginBooting ? bootingLabel : submitLabel}
                    </button>

                    {loginBooting && (
                        <div className="jarvis-boot-sequence">
                            <div className="jarvis-ring jarvis-ring-outer" />
                            <div className="jarvis-ring jarvis-ring-inner" />
                            <div className="jarvis-pulse-core" />
                            <div className="jarvis-scan-line" />
                            <div className="jarvis-boot-text">{bootStatus}</div>
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

    const settingsPanel = settingsOpen ? (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: isDark ? "rgba(3,6,14,0.72)" : "rgba(17,24,39,0.35)",
                zIndex: 1200,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 16,
            }}
            onClick={closeSettings}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: 520,
                    maxHeight: "88vh",
                    overflowY: "auto",
                    background: isDark ? "#0F1322" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#243153" : "#E5E7EB"}`,
                    borderRadius: 12,
                    boxShadow: isDark ? "0 24px 56px rgba(0,0,0,0.6)" : "0 20px 40px rgba(15,23,42,0.18)",
                    padding: 18,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: isDark ? "#E8EAF2" : "#111827" }}>Settings</div>
                        <div style={{ fontSize: 12, color: isDark ? "#8B91A8" : "#6B7280" }}>
                            {sessionDisplayName || sessionUserId} · {isAdmin ? "Admin" : "User"}
                        </div>
                    </div>
                    <button
                        onClick={closeSettings}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: isDark ? "#8B91A8" : "#6B7280",
                            cursor: "pointer",
                            fontSize: 18,
                        }}
                    >
                        ✕
                    </button>
                </div>

                {settingsError && (
                    <div style={{ marginBottom: 10, fontSize: 12, color: "#B91C1C", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 10px" }}>
                        {settingsError}
                    </div>
                )}
                {settingsSuccess && (
                    <div style={{ marginBottom: 10, fontSize: 12, color: "#065F46", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, padding: "8px 10px" }}>
                        {settingsSuccess}
                    </div>
                )}

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    {["account", "appearance", "support", ...(isAdmin ? ["users", "notifications"] : [])].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setSettingsTab(tab)}
                            style={{
                                background: settingsTab === tab ? "#2979FF" : (isDark ? "#141824" : "#F3F4F6"),
                                color: settingsTab === tab ? "#fff" : (isDark ? "#8B91A8" : "#4B5563"),
                                border: `1px solid ${settingsTab === tab ? "#2979FF" : (isDark ? "#1E2740" : "#E5E7EB")}`,
                                borderRadius: 8,
                                padding: "6px 10px",
                                cursor: "pointer",
                                fontSize: 12,
                                textTransform: "capitalize",
                            }}
                        >
                            {tab === "notifications" ? `notifications (${unreadSupportCount})` : tab}
                        </button>
                    ))}
                </div>

                {settingsTab === "account" && (
                    <>
                        <form onSubmit={handleChangeName} style={{ marginBottom: 12, padding: 12, borderRadius: 10, border: `1px solid ${isDark ? "#1E2740" : "#E5E7EB"}`, background: isDark ? "#0B0D18" : "#F9FAFB" }}>
                            <div style={{ fontSize: 12, color: isDark ? "#8B91A8" : "#6B7280", marginBottom: 8 }}>Name</div>
                            <input
                                value={displayNameForm}
                                onChange={(e) => setDisplayNameForm(e.target.value)}
                                placeholder="Display name"
                                style={{ width: "100%", boxSizing: "border-box", marginBottom: 8, background: isDark ? "#141824" : "#fff", border: `1px solid ${isDark ? "#1E2740" : "#D1D5DB"}`, borderRadius: 8, color: isDark ? "#E8EAF2" : "#111827", padding: "9px 10px", fontSize: 13, outline: "none" }}
                            />
                            <button type="submit" style={{ background: "#2979FF", border: "none", color: "#fff", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                                Update Name
                            </button>
                        </form>

                        <form onSubmit={handleChangePassword} style={{ marginBottom: 12, padding: 12, borderRadius: 10, border: `1px solid ${isDark ? "#1E2740" : "#E5E7EB"}`, background: isDark ? "#0B0D18" : "#F9FAFB" }}>
                            <div style={{ fontSize: 12, color: isDark ? "#8B91A8" : "#6B7280", marginBottom: 8 }}>Password</div>
                            <input
                                type="password"
                                value={passwordForm}
                                onChange={(e) => setPasswordForm(e.target.value)}
                                placeholder="New password"
                                style={{ width: "100%", boxSizing: "border-box", marginBottom: 8, background: isDark ? "#141824" : "#fff", border: `1px solid ${isDark ? "#1E2740" : "#D1D5DB"}`, borderRadius: 8, color: isDark ? "#E8EAF2" : "#111827", padding: "9px 10px", fontSize: 13, outline: "none" }}
                            />
                            <button type="submit" style={{ background: "#2979FF", border: "none", color: "#fff", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                                Update Password
                            </button>
                        </form>
                    </>
                )}

                {settingsTab === "appearance" && (
                    <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, border: `1px solid ${isDark ? "#1E2740" : "#E5E7EB"}`, background: isDark ? "#0B0D18" : "#F9FAFB" }}>
                        <div style={{ fontSize: 12, color: isDark ? "#8B91A8" : "#6B7280", marginBottom: 8 }}>Theme</div>
                        <button
                            onClick={toggle}
                            style={{
                                background: isDark ? "#141824" : "#111827",
                                border: `1px solid ${isDark ? "#1E2740" : "#374151"}`,
                                color: "#F9FAFB",
                                borderRadius: 8,
                                padding: "8px 12px",
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            {isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
                        </button>
                    </div>
                )}

                {settingsTab === "support" && (
                    <>
                        <form onSubmit={handleSendSupportMessage} style={{ marginBottom: 12, padding: 12, borderRadius: 10, border: `1px solid ${isDark ? "#1E2740" : "#E5E7EB"}`, background: isDark ? "#0B0D18" : "#F9FAFB" }}>
                            <div style={{ fontSize: 12, color: isDark ? "#8B91A8" : "#6B7280", marginBottom: 8 }}>Send suggestion / message to admin</div>
                            <textarea
                                value={supportMessageForm}
                                onChange={(e) => setSupportMessageForm(e.target.value)}
                                placeholder="Type your suggestion or issue..."
                                rows={4}
                                style={{ width: "100%", boxSizing: "border-box", marginBottom: 8, background: isDark ? "#141824" : "#fff", border: `1px solid ${isDark ? "#1E2740" : "#D1D5DB"}`, borderRadius: 8, color: isDark ? "#E8EAF2" : "#111827", padding: "9px 10px", fontSize: 13, outline: "none", resize: "vertical" }}
                            />
                            <button type="submit" style={{ background: "#2979FF", border: "none", color: "#fff", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                                Send
                            </button>
                        </form>

                        <div style={{ padding: 12, borderRadius: 10, border: `1px solid ${isDark ? "#1E2740" : "#E5E7EB"}`, background: isDark ? "#0B0D18" : "#F9FAFB" }}>
                            <div style={{ fontSize: 12, color: isDark ? "#8B91A8" : "#6B7280", marginBottom: 8 }}>Recent messages</div>
                            {supportMessages.length === 0 ? (
                                <div style={{ fontSize: 12, color: isDark ? "#6B7280" : "#9CA3AF" }}>No messages yet.</div>
                            ) : (
                                supportMessages.map((message) => (
                                    <div key={message.id} style={{ borderTop: `1px solid ${isDark ? "#1E2740" : "#E5E7EB"}`, paddingTop: 8, marginTop: 8 }}>
                                        <div style={{ fontSize: 12, color: isDark ? "#8B91A8" : "#6B7280" }}>
                                            {message.senderDisplayName} · {new Date(message.createdAt).toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: 13, color: isDark ? "#E8EAF2" : "#111827", marginTop: 4 }}>{message.messageText}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {isAdmin && settingsTab === "users" && (
                    <form onSubmit={handleAdminCreateUser} style={{ marginBottom: 12, padding: 12, borderRadius: 10, border: `1px solid ${isDark ? "#1E2740" : "#E5E7EB"}`, background: isDark ? "#0B0D18" : "#F9FAFB" }}>
                        <div style={{ fontSize: 12, color: isDark ? "#8B91A8" : "#6B7280", marginBottom: 8 }}>Create user</div>
                        <input
                            value={newUserId}
                            onChange={(e) => setNewUserId(e.target.value)}
                            placeholder="User ID"
                            style={{ width: "100%", boxSizing: "border-box", marginBottom: 8, background: isDark ? "#141824" : "#fff", border: `1px solid ${isDark ? "#1E2740" : "#D1D5DB"}`, borderRadius: 8, color: isDark ? "#E8EAF2" : "#111827", padding: "9px 10px", fontSize: 13, outline: "none" }}
                        />
                        <input
                            value={newUserDisplayName}
                            onChange={(e) => setNewUserDisplayName(e.target.value)}
                            placeholder="Display name"
                            style={{ width: "100%", boxSizing: "border-box", marginBottom: 8, background: isDark ? "#141824" : "#fff", border: `1px solid ${isDark ? "#1E2740" : "#D1D5DB"}`, borderRadius: 8, color: isDark ? "#E8EAF2" : "#111827", padding: "9px 10px", fontSize: 13, outline: "none" }}
                        />
                        <input
                            type="password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="Temporary password"
                            style={{ width: "100%", boxSizing: "border-box", marginBottom: 8, background: isDark ? "#141824" : "#fff", border: `1px solid ${isDark ? "#1E2740" : "#D1D5DB"}`, borderRadius: 8, color: isDark ? "#E8EAF2" : "#111827", padding: "9px 10px", fontSize: 13, outline: "none" }}
                        />
                        <select
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value)}
                            style={{ width: "100%", boxSizing: "border-box", marginBottom: 8, background: isDark ? "#141824" : "#fff", border: `1px solid ${isDark ? "#1E2740" : "#D1D5DB"}`, borderRadius: 8, color: isDark ? "#E8EAF2" : "#111827", padding: "9px 10px", fontSize: 13, outline: "none" }}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button type="submit" style={{ background: "#00A67E", border: "none", color: "#fff", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                            Create User
                        </button>
                    </form>
                )}

                {isAdmin && settingsTab === "notifications" && (
                    <div style={{ marginBottom: 12, padding: 12, borderRadius: 10, border: `1px solid ${isDark ? "#1E2740" : "#E5E7EB"}`, background: isDark ? "#0B0D18" : "#F9FAFB" }}>
                        <div style={{ fontSize: 12, color: isDark ? "#8B91A8" : "#6B7280", marginBottom: 8 }}>User notifications</div>
                        {supportMessages.length === 0 ? (
                            <div style={{ fontSize: 12, color: isDark ? "#6B7280" : "#9CA3AF" }}>No notifications yet.</div>
                        ) : (
                            supportMessages.map((message) => (
                                <div key={message.id} style={{ borderTop: `1px solid ${isDark ? "#1E2740" : "#E5E7EB"}`, paddingTop: 8, marginTop: 8 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                                        <div style={{ fontSize: 12, color: isDark ? "#8B91A8" : "#6B7280" }}>
                                            {message.senderDisplayName} · {new Date(message.createdAt).toLocaleString()}
                                        </div>
                                        {!message.isRead && (
                                            <button
                                                onClick={() => handleMarkMessageRead(message.id)}
                                                style={{ background: "#2563EB", border: "none", color: "#fff", borderRadius: 6, padding: "5px 8px", cursor: "pointer", fontSize: 11 }}
                                            >
                                                Mark read
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 13, color: isDark ? "#E8EAF2" : "#111827", marginTop: 4 }}>{message.messageText}</div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    style={{
                        width: "100%",
                        background: "#FEF2F2",
                        border: "1px solid #FECACA",
                        color: "#B91C1C",
                        borderRadius: 8,
                        padding: "10px 12px",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                    }}
                >
                    Logout
                </button>
            </div>
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

                    <button onClick={openSettings} title="Settings" style={{
                        background: "#141824", border: "1px solid #1E2740",
                        borderRadius: 8, padding: "8px 12px", cursor: "pointer",
                        color: "#8B91A8", fontSize: 13, transition: "all 0.15s",
                        marginLeft: isMobile ? "auto" : 0,
                        fontFamily: "'Inter', sans-serif", fontWeight: 600,
                        position: "relative",
                    }}>
                        Settings
                        {isAdmin && unreadSupportCount > 0 && (
                            <span style={{
                                position: "absolute",
                                top: -6,
                                right: -6,
                                minWidth: 18,
                                height: 18,
                                borderRadius: 999,
                                background: "#EF4444",
                                color: "#fff",
                                fontSize: 10,
                                lineHeight: "18px",
                                textAlign: "center",
                                fontWeight: 700,
                                padding: "0 4px",
                            }}>
                                {unreadSupportCount > 99 ? "99+" : unreadSupportCount}
                            </span>
                        )}
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

                    {isAdmin && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, color: "#8B91A8" }}>Admin Scope</span>
                            <select
                                value={ownerFilter}
                                onChange={(e) => setOwnerFilter(e.target.value)}
                                style={{
                                    background: "#141824",
                                    border: "1px solid #1E2740",
                                    color: "#E8EAF2",
                                    borderRadius: 6,
                                    padding: "5px 8px",
                                    fontSize: 12,
                                }}
                            >
                                <option value="all">All users</option>
                                {users.map((u) => (
                                    <option key={u.userId} value={u.userId}>
                                        {u.displayName || u.userId} ({u.projectCount})
                                    </option>
                                ))}
                            </select>
                            <span style={{ fontSize: 12, color: "#4A5170" }}>
                                Users: <strong style={{ color: "#E8EAF2" }}>{users.length}</strong>
                            </span>
                        </div>
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

                {settingsPanel}
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

                    {isAdmin && (
                        <select
                            value={ownerFilter}
                            onChange={(e) => setOwnerFilter(e.target.value)}
                            style={{
                                background: "#F9FAFB",
                                border: "1px solid #E5E7EB",
                                borderRadius: 8,
                                color: "#111827",
                                padding: "8px 10px",
                                fontSize: 12,
                                fontFamily: "'Inter',sans-serif",
                            }}
                        >
                            <option value="all">All Users</option>
                            {users.map((u) => (
                                <option key={u.userId} value={u.userId}>
                                    {u.displayName || u.userId} ({u.projectCount})
                                </option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={openSettings}
                        title="Settings"
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
                            position: "relative",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#1F2937"}
                        onMouseLeave={e => e.currentTarget.style.background = "#111827"}
                    >
                        Settings
                        {isAdmin && unreadSupportCount > 0 && (
                            <span style={{
                                position: "absolute",
                                top: -6,
                                right: -6,
                                minWidth: 18,
                                height: 18,
                                borderRadius: 999,
                                background: "#EF4444",
                                color: "#fff",
                                fontSize: 10,
                                lineHeight: "18px",
                                textAlign: "center",
                                fontWeight: 700,
                                padding: "0 4px",
                            }}>
                                {unreadSupportCount > 99 ? "99+" : unreadSupportCount}
                            </span>
                        )}
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

            {settingsPanel}
        </div>
    );
}

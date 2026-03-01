// ═══════════════════════════════════════
// KANBAN CARD — Theme-Aware
// ═══════════════════════════════════════

import { calcProgress, daysLeft } from "../utils";

// Tiny icon for tech tag highlight
function TechIcon({ tech }) {
    const icons = { React: "⚛", Vue: "◈", Angular: "△", Node: "⬡", Python: "Py", Django: "Dj", Docker: "⬡", AWS: "☁", TypeScript: "TS", JavaScript: "JS" };
    const match = Object.keys(icons).find((k) => tech.toLowerCase().includes(k.toLowerCase()));
    return match ? <span>{icons[match]}</span> : null;
}

export default function KanbanCard({ project, onDragStart, onClick, theme }) {
    const isDark = theme === "dark";
    const progress = calcProgress(project.tasks) ?? project.progress ?? 0;
    const days = project.deadline ? daysLeft(project.deadline) : null;
    const isReadOnly = Boolean(project.readOnly);

    // ── DARK MODE CARD (matches image exactly) ──
    if (isDark) {
        const isUrgent = days !== null && days < 4;
        const isLive = project.deployStatus === "live" || project.deployStatus === "Live" || project.deployed;

        return (
            <div
                draggable={!isReadOnly}
                onDragStart={(e) => {
                    if (isReadOnly) return;
                    onDragStart(e, project.id);
                }}
                onClick={() => onClick(project)}
                style={{
                    background: "#141824",
                    border: "1px solid #1E2740",
                    borderRadius: 10,
                    padding: "16px 16px 12px",
                    marginBottom: 8,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    position: "relative",
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#2979FF40";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.6)";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "#1E2740";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                }}
            >
                {/* Title + options */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#E8EAF2", lineHeight: 1.3, flex: 1 }}>
                        {project.title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {isReadOnly && (
                            <span style={{
                                fontSize: 10,
                                color: "#8B91A8",
                                border: "1px solid #1E2740",
                                borderRadius: 4,
                                padding: "1px 6px",
                                letterSpacing: "0.05em",
                            }}>
                                READ ONLY
                            </span>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); onClick(project); }} style={{
                            background: "none", border: "none", color: "#4A5170", cursor: "pointer", fontSize: 14, padding: "0 0 0 8px", lineHeight: 1
                        }}>⋯</button>
                    </div>
                </div>

                {/* Description */}
                {project.description && (
                    <div style={{ fontSize: 12, color: "#8B91A8", lineHeight: 1.5, marginBottom: 12, fontFamily: "'Inter', sans-serif" }}>
                        {project.description.length > 70 ? project.description.slice(0, 70) + "…" : project.description}
                    </div>
                )}

                {/* Tech tags */}
                {(project.techStack || project.tags || []).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                        {(project.techStack || project.tags || []).slice(0, 4).map((t, i) => (
                            <span key={i} style={{
                                background: i === 0 ? "rgba(41,121,255,0.15)" : "#1E2740",
                                border: `1px solid ${i === 0 ? "rgba(41,121,255,0.3)" : "#232e48"}`,
                                color: i === 0 ? "#5B9EFF" : "#8B91A8",
                                borderRadius: 5, padding: "2px 8px",
                                fontSize: 11, fontFamily: "'Inter', sans-serif",
                                display: "flex", alignItems: "center", gap: 4,
                            }}>
                                {i === 0 && <TechIcon tech={t} />}
                                {t}
                            </span>
                        ))}
                    </div>
                )}

                {/* LIVE + Due + Progress % */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    {isLive && (
                        <span style={{
                            display: "flex", alignItems: "center", gap: 4,
                            background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.25)",
                            color: "#00C896", borderRadius: 5, padding: "3px 8px",
                            fontSize: 11, fontWeight: 600, fontFamily: "'Inter', sans-serif",
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C896", display: "inline-block" }} />
                            LIVE
                        </span>
                    )}
                    {days !== null && (
                        <span style={{ fontSize: 12, color: isUrgent ? "#FF4B4B" : "#8B91A8", fontFamily: "'Inter', sans-serif" }}>
                            {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `Due in ${days} day${days !== 1 ? "s" : ""}`}
                        </span>
                    )}
                    {progress > 0 && (
                        <span style={{ marginLeft: "auto", fontSize: 12, color: "#8B91A8", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                            {progress}%
                        </span>
                    )}
                </div>

                {/* Progress bar */}
                <div style={{ height: 3, background: "#1E2740", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
                    <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${progress}%`,
                        background: progress === 100 ? "#00C896" : isUrgent ? "#FF4B4B" : "#2979FF",
                        transition: "width 0.4s ease",
                    }} />
                </div>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "#4A5170", fontFamily: "'Inter', sans-serif" }}>
                        Progress {progress}%
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); onClick(project); }} style={{ background: "none", border: "none", color: "#4A5170", cursor: "pointer", fontSize: 13, padding: 0 }}>
                        ⋯
                    </button>
                </div>
            </div>
        );
    }

    // ── LIGHT MODE CARD (clean white — matches image) ──
    const TECH_COLORS = {
        React: { bg: "#EFF6FF", color: "#2563EB", icon: "⚛" },
        TypeScript: { bg: "#EFF6FF", color: "#3B82F6", icon: "TS" },
        "Node": { bg: "#F0FDF4", color: "#16A34A", icon: "⬡" },
        Firebase: { bg: "#FFF7ED", color: "#EA580C", icon: "🔥" },
        MongoDB: { bg: "#F0FDF4", color: "#16A34A", icon: "🍃" },
        "Next.js": { bg: "#F9FAFB", color: "#111827", icon: "▲" },
        Tailwind: { bg: "#F0FDFA", color: "#0891B2", icon: "💧" },
        PostgreSQL: { bg: "#EFF6FF", color: "#2563EB", icon: "🐘" },
        Vue: { bg: "#F0FDF4", color: "#16A34A", icon: "◈" },
        Express: { bg: "#F9FAFB", color: "#374151", icon: "E" },
        Docker: { bg: "#EFF6FF", color: "#2563EB", icon: "🐳" },
        Angular: { bg: "#FEF2F2", color: "#DC2626", icon: "△" },
        Stripe: { bg: "#EEF2FF", color: "#6366F1", icon: "◈" },
        AWS: { bg: "#FFF7ED", color: "#EA580C", icon: "☁" },
        Flutter: { bg: "#EFF6FF", color: "#0284C7", icon: "◇" },
        SQLite: { bg: "#EFF6FF", color: "#2563EB", icon: "🗄" },
    };
    const PRIORITY_CFG = {
        High: { color: "#EF4444", bg: "#FEF2F2", icon: "🔴" },
        Medium: { color: "#F59E0B", bg: "#FFFBEB", icon: "🟠" },
        Low: { color: "#10B981", bg: "#F0FDF4", icon: "🟢" },
    };
    const prCfg = PRIORITY_CFG[project.priority] || PRIORITY_CFG.Medium;
    const isUrgentLight = days !== null && days < 4;
    const isCompleted = project.status === "Completed";
    const isLiveLight = project.deployStatus === "live" || project.deployed;

    return (
        <div
            draggable={!isReadOnly}
            onDragStart={(e) => {
                if (isReadOnly) return;
                onDragStart(e, project.id);
            }}
            onClick={() => onClick(project)}
            style={{
                background: "#FFFFFF", border: "1px solid #E5E7EB",
                borderRadius: 12, padding: "16px", marginBottom: 10,
                cursor: "pointer", transition: "all 0.15s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
        >
            {/* Title + Done check + menu */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 700, color: "#111827", flex: 1, lineHeight: 1.3 }}>
                    {project.title}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8, flexShrink: 0 }}>
                    {isReadOnly && (
                        <span style={{ fontSize: 9, color: "#6B7280", border: "1px solid #D1D5DB", borderRadius: 4, padding: "1px 6px", fontFamily: "'Inter',sans-serif", fontWeight: 700 }}>
                            READ ONLY
                        </span>
                    )}
                    {isCompleted && <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#D1FAE5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#059669" }}>✓</span>}
                    <button onClick={(e) => { e.stopPropagation(); onClick(project); }} style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: 16, padding: "0 2px" }}>⋯</button>
                </div>
            </div>

            {/* Description */}
            {project.description && (
                <div style={{ fontSize: 12.5, color: "#6B7280", lineHeight: 1.5, marginBottom: 10, fontFamily: "'Inter',sans-serif" }}>
                    {project.description.length > 65 ? project.description.slice(0, 65) + "…" : project.description}
                </div>
            )}

            {/* Tech badges */}
            {(project.techStack || project.tags || []).slice(0, 3).length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                    {(project.techStack || project.tags || []).slice(0, 3).map((t, i) => {
                        const tc = TECH_COLORS[t] || { bg: "#F3F4F6", color: "#374151", icon: "" };
                        return (
                            <span key={i} style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.color}25`, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontFamily: "'Inter',sans-serif", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <span style={{ fontSize: 10 }}>{tc.icon}</span> {t}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* LIVE badge */}
            {isLiveLight && (
                <div style={{ marginBottom: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#EFF6FF", color: "#2563EB", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB", display: "inline-block" }} /> LIVE
                    </span>
                </div>
            )}

            {/* Priority + Due Date (non-completed) */}
            {!isCompleted && (
                <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                    {project.priority && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 11, color: "#6B7280", fontFamily: "'Inter',sans-serif" }}>Priority</span>
                            <span style={{ background: prCfg.bg, color: prCfg.color, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600, fontFamily: "'Inter',sans-serif", display: "inline-flex", alignItems: "center", gap: 3 }}>
                                {prCfg.icon} {project.priority}
                            </span>
                        </div>
                    )}
                    {days !== null && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ fontSize: 12 }}>📅</span>
                            <span style={{ fontSize: 12, color: isUrgentLight ? "#EF4444" : "#374151", fontFamily: "'Inter',sans-serif", fontWeight: 500 }}>
                                {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : new Date(project.deadline).toLocaleDateString("en-US", { day: "numeric", month: "long" })}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Completed date row */}
            {isCompleted && days !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 12 }}>📅</span>
                    <span style={{ fontSize: 12, color: "#374151", fontFamily: "'Inter',sans-serif", fontWeight: 500 }}>
                        {new Date(project.deadline).toLocaleDateString("en-US", { day: "numeric", month: "long" })}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#10B981", fontFamily: "'Inter',sans-serif" }}>{progress}%</span>
                </div>
            )}

            {/* Progress bar */}
            <div style={{ height: 5, background: "#F3F4F6", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: isCompleted ? "#10B981" : isUrgentLight ? "#EF4444" : "#2563EB", borderRadius: 10, transition: "width 0.4s" }} />
            </div>
            {!isCompleted && (
                <div style={{ textAlign: "right", marginTop: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isUrgentLight ? "#EF4444" : "#2563EB", fontFamily: "'Inter',sans-serif" }}>{progress}%</span>
                </div>
            )}
        </div>
    );
}

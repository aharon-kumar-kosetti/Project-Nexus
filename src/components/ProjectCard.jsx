// ═══════════════════════════════════════════════════
// PROJECT CARD — Grid View Card (Theme-Aware)
// ═══════════════════════════════════════════════════

import { STATUS_CFG, PRI_CFG } from "../constants";
import { calcProgress, daysLeft } from "../utils";
import ProgressRing from "./ProgressRing";
import TechBadge from "./TechBadge";
import DeployBadge from "./DeployBadge";

export default function ProjectCard({ project, onClick, onDragStart, theme }) {
    const isDark = theme === "dark";
    const sc = STATUS_CFG[project.status];
    const pc = PRI_CFG[project.priority];
    const dl = daysLeft(project.deadline);
    const prog = calcProgress(project.tasks) ?? project.progress;
    const doneTasks = project.tasks?.filter((t) => t.done).length || 0;
    const isLive = project.deployStatus === "live" || project.deployStatus === "Live" || project.deployed;
    const isUrgent = dl !== null && dl < 4;

    // ── DARK MODE ──
    if (isDark) {
        const STATUS_DOTS = { Upcoming: "#4A5170", Ongoing: "#2979FF", Completed: "#00C896", Paused: "#F59E0B" };
        const dotColor = STATUS_DOTS[project.status] || "#4A5170";

        return (
            <div
                draggable
                onDragStart={(e) => onDragStart(e, project.id)}
                onClick={() => onClick(project)}
                style={{
                    background: "#141824",
                    border: "1px solid #1E2740",
                    borderRadius: 12,
                    padding: 20,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    userSelect: "none",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.6)";
                    e.currentTarget.style.borderColor = "#2979FF40";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = "";
                    e.currentTarget.style.borderColor = "#1E2740";
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: "#E8EAF2", lineHeight: 1.3, flex: 1 }}>
                        {project.title}
                    </div>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0, marginTop: 5, marginLeft: 10, boxShadow: project.status === "Ongoing" ? `0 0 8px ${dotColor}` : "none" }} />
                </div>

                {/* Description */}
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#8B91A8", lineHeight: 1.5, fontFamily: "'Inter', sans-serif", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {project.description || "No description."}
                </p>

                {/* Tech tags */}
                {(project.techStack || project.tags || []).length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                        {(project.techStack || project.tags || []).slice(0, 4).map((t, i) => (
                            <span key={i} style={{
                                background: i === 0 ? "rgba(41,121,255,0.12)" : "#1E2740",
                                border: `1px solid ${i === 0 ? "rgba(41,121,255,0.3)" : "#232e48"}`,
                                color: i === 0 ? "#5B9EFF" : "#8B91A8",
                                borderRadius: 5, padding: "2px 8px",
                                fontSize: 11, fontFamily: "'Inter', sans-serif",
                            }}>
                                {t}
                            </span>
                        ))}
                    </div>
                )}

                {/* Meta row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {isLive && (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.25)", color: "#00C896", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00C896", display: "inline-block" }} />
                                LIVE
                            </span>
                        )}
                        {dl !== null && (
                            <span style={{ fontSize: 12, color: isUrgent ? "#FF4B4B" : "#4A5170", fontFamily: "'Inter', sans-serif" }}>
                                {dl < 0 ? `${Math.abs(dl)}d overdue` : dl === 0 ? "Due today" : `Due ${new Date(project.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                            </span>
                        )}
                    </div>
                    {doneTasks > 0 && project.tasks?.length > 0 && (
                        <span style={{ fontSize: 12, color: "#4A5170", fontFamily: "'Inter', sans-serif" }}>
                            {doneTasks}/{project.tasks.length} tasks
                        </span>
                    )}
                </div>

                {/* Progress */}
                <div style={{ height: 3, background: "#1E2740", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${prog || 0}%`,
                        background: prog === 100 ? "#00C896" : isUrgent ? "#FF4B4B" : "#2979FF",
                        transition: "width 0.4s ease",
                    }} />
                </div>
            </div>
        );
    }

    // ── LIGHT MODE (existing HUD design) ──
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, project.id)}
            onClick={() => onClick(project)}
            style={{
                background: "#0c0c1e",
                border: `1px solid ${sc.color}30`,
                borderRadius: 12,
                padding: 20,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.2s ease",
                userSelect: "none",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = sc.color + "80";
                e.currentTarget.style.boxShadow = `0 0 20px ${sc.glow}, inset 0 0 20px ${sc.glow}30`;
                e.currentTarget.style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = sc.color + "30";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            {/* Top color bar */}
            <div
                style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg,${sc.color},transparent)`,
                    borderRadius: "12px 12px 0 0",
                }}
            />

            {/* Corner HUD brackets */}
            <div style={{ position: "absolute", top: 8, left: 8, width: 12, height: 12, borderTop: `1px solid ${sc.color}`, borderLeft: `1px solid ${sc.color}` }} />
            <div style={{ position: "absolute", top: 8, right: 8, width: 12, height: 12, borderTop: `1px solid ${sc.color}`, borderRight: `1px solid ${sc.color}` }} />
            <div style={{ position: "absolute", bottom: 8, left: 8, width: 12, height: 12, borderBottom: `1px solid ${sc.color}`, borderLeft: `1px solid ${sc.color}` }} />
            <div style={{ position: "absolute", bottom: 8, right: 8, width: 12, height: 12, borderBottom: `1px solid ${sc.color}`, borderRight: `1px solid ${sc.color}` }} />

            {/* Halftone dot bg */}
            <div
                style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `radial-gradient(${sc.color}08 1px, transparent 1px)`,
                    backgroundSize: "18px 18px",
                    pointerEvents: "none",
                }}
            />

            <div style={{ position: "relative" }}>
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ flex: 1, marginRight: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 9, color: sc.color, fontFamily: "'Orbitron',monospace", fontWeight: 700, letterSpacing: 1.5, background: sc.glow, padding: "2px 7px", borderRadius: 3 }}>
                                {sc.icon} {sc.tag}
                            </span>
                            <span style={{ fontSize: 9, color: pc.color, background: pc.bg, padding: "2px 7px", borderRadius: 3, fontFamily: "'Orbitron',monospace", fontWeight: 700, letterSpacing: 1 }}>
                                {pc.label}
                            </span>
                        </div>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#f0eeff", fontFamily: "'Rajdhani',sans-serif", lineHeight: 1.2, letterSpacing: 0.3 }}>
                            {project.title}
                        </h3>
                    </div>
                    <ProgressRing progress={prog} size={52} color={sc.color} />
                </div>

                {/* Description */}
                <p style={{ margin: "0 0 10px", fontSize: 11.5, color: "#666", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {project.description || "No description provided."}
                </p>

                {/* Tech Stack */}
                {project.techStack?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                        {project.techStack.slice(0, 4).map((t) => (
                            <TechBadge key={t} label={t} small />
                        ))}
                        {project.techStack.length > 4 && (
                            <span style={{ fontSize: 9, color: "#555", padding: "1px 6px" }}>+{project.techStack.length - 4}</span>
                        )}
                    </div>
                )}

                {/* Tags */}
                {project.tags?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                        {project.tags.map((t) => (
                            <span key={t} style={{ fontSize: 9, color: "#888", background: "#ffffff08", border: "1px solid #ffffff12", padding: "1px 7px", borderRadius: 3, fontFamily: "'Orbitron',monospace", letterSpacing: 0.5 }}>
                                {t}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <DeployBadge project={project} />
                        {project.repoLink && (
                            <a
                                href={project.repoLink} target="_blank" rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{ fontSize: 9, color: "#888", background: "#ffffff08", border: "1px solid #ffffff12", padding: "2px 8px", borderRadius: 3, fontFamily: "'Orbitron',monospace", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
                            >
                                ⌥ REPO
                            </a>
                        )}
                        {project.docs?.length > 0 && (
                            <span style={{ fontSize: 9, color: "#888", fontFamily: "'Orbitron',monospace" }}>📎 {project.docs.length}</span>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {project.tasks?.length > 0 && (
                            <span style={{ fontSize: 9, color: "#555", fontFamily: "'Orbitron',monospace" }}>
                                {doneTasks}/{project.tasks.length} tasks
                            </span>
                        )}
                        {dl !== null && (
                            <span
                                style={{
                                    fontSize: 9,
                                    fontFamily: "'Orbitron',monospace",
                                    color: dl < 0 ? "#FF003C" : dl < 7 ? "#FF003C" : dl < 30 ? "#FFD700" : "#555",
                                    background: (dl < 7 ? "#FF003C" : dl < 30 ? "#FFD700" : "#ffffff") + "12",
                                    padding: "2px 7px",
                                    borderRadius: 3,
                                }}
                            >
                                {dl < 0 ? `${Math.abs(dl)}d OVERDUE` : dl === 0 ? "DUE TODAY" : `${dl}d LEFT`}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

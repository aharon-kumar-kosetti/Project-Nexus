// ═══════════════════════════════════════
// KANBAN COLUMN — Theme-Aware
// ═══════════════════════════════════════

import { useState } from "react";
import KanbanCard from "./KanbanCard";

const STATUS_META = {
    Upcoming: { label: "UPCOMING", lightColor: "#00BFFF" },
    Ongoing: { label: "ONGOING", lightColor: "#FF003C" },
    Completed: { label: "DONE", lightColor: "#00FF88" },
    Paused: { label: "PAUSED", lightColor: "#FFD700" },
};

export default function KanbanColumn({ status, projects, onDrop, onDragOver, onProjectClick, onDragStart, theme }) {
    const isDark = theme === "dark";
    const meta = STATUS_META[status] || { label: status.toUpperCase(), lightColor: "#666" };
    const [hovered, setHovered] = useState(false);

    // ── DARK MODE COLUMN (matches image) ──
    if (isDark) {
        return (
            <div
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, status)}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", cursor: "default" }}
            >
                {/* Column header — highlights when anywhere in column is hovered */}
                <div
                    style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "16px 20px 12px",
                        borderBottom: `2px solid ${hovered ? "#2979FF" : "#1E2740"}`,
                        marginBottom: 0,
                        transition: "border-color 0.15s ease",
                    }}
                >
                    <span style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 11, fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: hovered ? "#2979FF" : "#4A5170",
                        transition: "color 0.15s ease",
                    }}>
                        {meta.label} ({projects.length})
                    </span>
                </div>

                {/* Cards area */}
                <div style={{ flex: 1, padding: "12px 12px 12px", minHeight: 160 }}>
                    {projects.length === 0 ? (
                        <div style={{
                            border: "1px dashed #1E2740",
                            borderRadius: 8, padding: "22px 12px",
                            textAlign: "center", color: "#2A3450",
                            fontSize: 11, letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            fontFamily: "'Inter', sans-serif",
                            margin: "8px 0",
                        }}>
                            Drop Here
                        </div>
                    ) : (
                        projects.map((p) => (
                            <KanbanCard
                                key={p.id}
                                project={p}
                                onDragStart={onDragStart}
                                onClick={onProjectClick}
                                theme={theme}
                            />
                        ))
                    )}

                    {/* Always show a drop zone at the bottom */}
                    {projects.length > 0 && (
                        <div style={{
                            border: "1px dashed #1A2038",
                            borderRadius: 8, padding: "14px 12px",
                            textAlign: "center", color: "#1A2038",
                            fontSize: 11, letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            fontFamily: "'Inter', sans-serif",
                        }}>
                            Drop Here
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── LIGHT MODE COLUMN (clean white — matches image) ──
    const COL_CFG = {
        Upcoming: { label: "Upcoming", color: "#3B82F6", bg: "#EFF6FF", icon: "🕐" },
        Ongoing: { label: "Ongoing", color: "#F59E0B", bg: "#FFFBEB", icon: "⚡" },
        Completed: { label: "Done", color: "#10B981", bg: "#F0FDF4", icon: "✓" },
        Paused: { label: "Paused", color: "#9CA3AF", bg: "#F9FAFB", icon: "⏸" },
    };
    const cfg = COL_CFG[status] || { label: status, color: "#6B7280", bg: "#F9FAFB", icon: "○" };

    return (
        <div
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, status)}
            style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column" }}
        >
            {/* Column header */}
            <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{cfg.icon}</span>
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 700, color: "#111827" }}>
                        {cfg.label}
                    </span>
                    <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "2px 9px", fontSize: 12, fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>
                        {projects.length}
                    </span>
                </div>
                <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 18, lineHeight: 1 }}>+</button>
            </div>

            {/* Color underline */}
            <div style={{ height: 3, background: cfg.color, borderRadius: "0 0 3px 3px", margin: "0 16px 12px" }} />

            {/* Cards */}
            <div style={{ flex: 1, padding: "0 12px", overflowY: "auto" }}>
                {projects.length === 0 && (
                    <div style={{ border: "1.5px dashed #E5E7EB", borderRadius: 10, padding: "20px 12px", textAlign: "center", color: "#D1D5DB", fontSize: 12, fontFamily: "'Inter',sans-serif", margin: "4px 0 8px" }}>
                        Drop here
                    </div>
                )}
                {projects.map((p) => (
                    <KanbanCard key={p.id} project={p} onDragStart={onDragStart} onClick={onProjectClick} theme={theme} />
                ))}
                {projects.length > 0 && (
                    <div style={{ border: "1.5px dashed #E5E7EB", borderRadius: 10, padding: "12px", textAlign: "center", color: "#D1D5DB", fontSize: 11, fontFamily: "'Inter',sans-serif", margin: "0 0 8px" }}>
                        Drop here
                    </div>
                )}
            </div>
        </div>
    );
}

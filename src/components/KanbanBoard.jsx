// ═══════════════════════════════════════
// KANBAN BOARD — Theme-Aware
// ═══════════════════════════════════════

import { STATUSES } from "../constants";
import KanbanColumn from "./KanbanColumn";

export default function KanbanBoard({ projects, onDrop, onDragOver, onProjectClick, onDragStart, theme, isMobile = false }) {
    const isDark = theme === "dark";

    const grouped = STATUSES.reduce((acc, s) => {
        acc[s] = projects.filter((p) => p.status === s);
        return acc;
    }, {});

    // ── DARK MODE BOARD (matches image — horizontal columns with dividers) ──
    if (isDark) {
        return (
            <div className="nx-kanban-board" style={{
                display: "grid",
                gridTemplateColumns: isMobile ? `repeat(${STATUSES.length}, minmax(280px, 1fr))` : `repeat(${STATUSES.length}, 1fr)`,
                borderTop: "1px solid #1E2740",
                height: isMobile ? "auto" : "calc(100vh - 140px)",
                overflowX: isMobile ? "auto" : "auto",
                overflowY: "auto",
            }}>
                {STATUSES.map((status, i) => (
                    <div key={status} style={{
                        borderRight: i < STATUSES.length - 1 && !isMobile ? "1px solid #1E2740" : "none",
                        display: "flex", flexDirection: "column",
                        minWidth: isMobile ? 280 : 0,
                    }}>
                        <KanbanColumn
                            status={status}
                            projects={grouped[status] || []}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onProjectClick={onProjectClick}
                            onDragStart={onDragStart}
                            theme={theme}
                            activeColumn={grouped["Ongoing"]?.length > 0 ? "Ongoing" : null}
                        />
                    </div>
                ))}
            </div>
        );
    }

    // ── LIGHT MODE BOARD (existing HUD horizontal layout) ──
    return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STATUSES.length}, 1fr)`, gap: 16 }}>
            {STATUSES.map((status) => (
                <KanbanColumn
                    key={status}
                    status={status}
                    projects={grouped[status] || []}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onProjectClick={onProjectClick}
                    onDragStart={onDragStart}
                    theme={theme}
                />
            ))}
        </div>
    );
}

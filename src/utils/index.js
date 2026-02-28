// ═══════════════════════════════════════════════════
// PROJECT NEXUS — UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════

/** Generate a random 8-char alphanumeric ID */
export const genId = () => Math.random().toString(36).slice(2, 10);

/** Calculate progress % from a tasks array (returns null if no tasks) */
export const calcProgress = (tasks) =>
    tasks?.length
        ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100)
        : null;

/** Calculate days remaining until a deadline (returns null if no deadline) */
export const daysLeft = (dl) =>
    dl ? Math.ceil((new Date(dl) - new Date()) / 86400000) : null;

/** Format an ISO timestamp into "Jan 10 · 09:00 AM" style */
export const fmtTime = (iso) => {
    const d = new Date(iso);
    return (
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
        " · " +
        d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    );
};

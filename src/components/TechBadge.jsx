// ═══════════════════════════════════════════════════
// TECH BADGE — Colored Tech Stack Badge
// ═══════════════════════════════════════════════════

import { TECH_LIST } from "../constants";

export default function TechBadge({ label, small = false }) {
    const tech = TECH_LIST.find((t) => t.label === label) || { icon: "?", color: "#888", label };

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: tech.color + "18",
                border: `1px solid ${tech.color}40`,
                color: tech.color,
                fontSize: small ? 9 : 10,
                padding: small ? "1px 6px" : "2px 8px",
                borderRadius: 4,
                fontFamily: "'Orbitron',monospace",
                fontWeight: 700,
                letterSpacing: 0.3,
                whiteSpace: "nowrap",
            }}
        >
            <span style={{ fontSize: small ? 8 : 10 }}>{tech.icon}</span>
            {label}
        </span>
    );
}

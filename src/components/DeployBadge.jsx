// ═══════════════════════════════════════════════════
// DEPLOY BADGE — Deployment Status Indicator
// ═══════════════════════════════════════════════════

export default function DeployBadge({ project }) {
    if (project.deployStatus === "live" && project.deployLink) {
        return (
            <a
                href={project.deployLink}
                target="_blank"
                rel="noreferrer"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "#00FF8820",
                    border: "1px solid #00FF8860",
                    color: "#00FF88",
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontFamily: "'Orbitron',monospace",
                    fontWeight: 700,
                    textDecoration: "none",
                    cursor: "pointer",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <span
                    style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "#00FF88",
                        display: "inline-block",
                        animation: "pulse 1.5s infinite",
                    }}
                />
                LIVE
            </a>
        );
    }

    const label =
        project.deployStatus === "custom" && project.deployLabel
            ? project.deployLabel
            : "NOT DEPLOYED";

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "#FF003C18",
                border: "1px solid #FF003C40",
                color: "#FF003C80",
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 4,
                fontFamily: "'Orbitron',monospace",
                fontWeight: 700,
            }}
        >
            ⊘ {label}
        </span>
    );
}

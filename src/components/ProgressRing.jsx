// ═══════════════════════════════════════════════════
// PROGRESS RING — SVG Circular Progress Indicator
// ═══════════════════════════════════════════════════

export default function ProgressRing({ progress = 0, size = 56, stroke = 4, color = "#FF003C" }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (progress / 100) * circ;

    return (
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke="#1a1a2e" strokeWidth={stroke}
            />
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.6s ease", filter: `drop-shadow(0 0 4px ${color}80)` }}
            />
            <text
                x="50%" y="50%"
                dominantBaseline="middle" textAnchor="middle"
                fill={color} fontSize={size / 5.2} fontWeight="800"
                style={{ transform: "rotate(90deg)", transformOrigin: "center", fontFamily: "'Orbitron',monospace" }}
            >
                {progress}%
            </text>
        </svg>
    );
}

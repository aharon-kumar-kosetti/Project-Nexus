// ═══════════════════════════════════════════════════
// MODAL — Project Create / Edit (Theme-Aware)
// ═══════════════════════════════════════════════════

import { useEffect, useState, useRef } from "react";
import { STATUSES, PRIORITIES, TECH_LIST } from "../constants";
import { genId, calcProgress, fmtTime } from "../utils";
import {
    uploadDocs,
    deleteDoc,
    fetchProjectAccess,
    searchProjectUsers,
    grantProjectReadAccess,
    revokeProjectReadAccess,
} from "../api/projects";
import TechBadge from "./TechBadge";

const BASE_TABS = ["overview", "tech", "tasks", "docs", "activity"];

export default function Modal({ project, onClose, onSave, onDelete, theme, readOnly = false, canManageAccess = false, onAccessChanged }) {
    const isDark = theme === "dark";
    const isNew = !project;
    const isReadOnly = Boolean(readOnly && !isNew);
    const tabs = [...BASE_TABS, ...(canManageAccess && !isNew ? ["access"] : [])];

    const [form, setForm] = useState(
        project
            ? { ...project }
            : {
                id: genId(),
                title: "",
                description: "",
                status: "Upcoming",
                priority: "Medium",
                progress: 0,
                tags: [],
                techStack: [],
                repoLink: "",
                deployLink: "",
                deployStatus: "not-deployed",
                deployLabel: "",
                docs: [],
                deadline: "",
                createdAt: new Date().toISOString().slice(0, 10),
                tasks: [],
                notes: "",
                activityLog: [],
            }
    );

    const [tab, setTab] = useState("overview");
    const [tagIn, setTagIn] = useState("");
    const [taskIn, setTaskIn] = useState("");
    const [techSearch, setTechSearch] = useState("");
    const [accessQuery, setAccessQuery] = useState("");
    const [accessResults, setAccessResults] = useState([]);
    const [sharedUsers, setSharedUsers] = useState([]);
    const [accessLoading, setAccessLoading] = useState(false);
    const [accessError, setAccessError] = useState("");
    const [accessSuccess, setAccessSuccess] = useState("");
    const fileRef = useRef();

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const prog = calcProgress(form.tasks) ?? form.progress;

    useEffect(() => {
        if (tabs.includes(tab)) return;
        setTab("overview");
    }, [tab, tabs]);

    const loadSharedUsers = async () => {
        if (isNew || !canManageAccess) return;
        try {
            const list = await fetchProjectAccess(form.id);
            setSharedUsers(list || []);
        } catch (err) {
            console.error("Failed to load shared users:", err);
            setAccessError(err?.message || "Failed to load access list.");
        }
    };

    useEffect(() => {
        if (tab !== "access" || isNew || !canManageAccess) return;
        loadSharedUsers();
    }, [tab, isNew, canManageAccess]);

    // ── Tag helpers ──
    const addTag = () => {
        if (isReadOnly) return;
        if (tagIn.trim() && !form.tags.includes(tagIn.trim())) {
            set("tags", [...form.tags, tagIn.trim()]);
            setTagIn("");
        }
    };
    const removeTag = (t) => {
        if (isReadOnly) return;
        set("tags", form.tags.filter((x) => x !== t));
    };

    // ── Tech helpers ──
    const toggleTech = (t) =>
        !isReadOnly && set("techStack", form.techStack.includes(t) ? form.techStack.filter((x) => x !== t) : [...form.techStack, t]);

    // ── Task helpers ──
    const addTask = () => {
        if (isReadOnly) return;
        if (taskIn.trim()) {
            set("tasks", [...form.tasks, { id: genId(), text: taskIn.trim(), done: false }]);
            setTaskIn("");
        }
    };
    const toggleTask = (id) => {
        if (isReadOnly) return;
        set("tasks", form.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    };
    const removeTask = (id) => {
        if (isReadOnly) return;
        set("tasks", form.tasks.filter((t) => t.id !== id));
    };

    // ── File upload ──
    const handleFileUpload = async (e) => {
        if (isReadOnly) return;
        const files = Array.from(e.target.files);
        const toUpload = files.filter((file) => {
            if (file.size > 4 * 1024 * 1024) { alert(`${file.name} exceeds 4MB limit.`); return false; }
            return true;
        });
        if (toUpload.length === 0) return;
        if (isNew) {
            const docsToAdd = toUpload.map((file) => ({
                id: genId(),
                name: file.name,
                type: file.type,
                size: file.size,
                path: "",
                uploadedAt: new Date().toISOString(),
                _file: file,
            }));
            setForm((prev) => ({ ...prev, docs: [...(prev.docs || []), ...docsToAdd] }));
        } else {
            try {
                const newDocs = await uploadDocs(form.id, toUpload);
                setForm((prev) => ({ ...prev, docs: [...(prev.docs || []), ...newDocs] }));
            } catch (err) {
                console.error("Upload failed:", err);
                alert("File upload failed.");
            }
        }
    };
    const removeDoc = async (id) => {
        if (isReadOnly) return;
        if (!isNew) {
            try { await deleteDoc(form.id, id); }
            catch (err) { console.error("Delete doc failed:", err); }
        }
        setForm((prev) => ({ ...prev, docs: (prev.docs || []).filter((d) => d.id !== id) }));
    };
    const viewDoc = (doc) => {
        if (doc.path) window.open(doc.path, "_blank");
        else if (doc.data) {
            const w = window.open();
            if (w) {
                w.document.write(`<iframe src="${doc.data}" style="width:100%;height:100vh;border:none"/>`);
            }
        }
    };

    // ── Save handler ──
    const handleSave = () => {
        if (isReadOnly) {
            alert("This project is shared with you in read-only mode.");
            return;
        }
        if (!form.title.trim()) { alert("Title required!"); return; }
        const newLog = [...(form.activityLog || [])];
        if (isNew) {
            newLog.push({ ts: new Date().toISOString(), action: "Project created" });
        } else {
            const changes = [];
            if (project.status !== form.status) changes.push(`Status → ${form.status}`);
            if (project.priority !== form.priority) changes.push(`Priority → ${form.priority}`);
            if (project.repoLink !== form.repoLink && form.repoLink) changes.push("Repo link added");
            if (project.deployStatus !== form.deployStatus) changes.push(`Deploy → ${form.deployStatus === "live" ? "Live" : form.deployLabel || "Not Deployed"}`);
            const newDone = form.tasks.filter((t) => t.done && !project.tasks?.find((pt) => pt.id === t.id && pt.done)).map((t) => t.text);
            newDone.forEach((t) => changes.push(`Task done: "${t}"`));
            if ((form.docs?.length || 0) > (project.docs?.length || 0)) changes.push("Docs uploaded");
            newLog.push({ ts: new Date().toISOString(), action: changes.length > 0 ? changes.join(" · ") : "Project updated" });
        }
        onSave({ ...form, progress: prog, activityLog: newLog });
    };

    const handleSearchUsers = async () => {
        const value = String(accessQuery || "").trim();
        if (!value) {
            setAccessResults([]);
            setAccessError("");
            return;
        }

        setAccessLoading(true);
        setAccessError("");
        setAccessSuccess("");

        try {
            const result = await searchProjectUsers(form.id, value);
            setAccessResults(result || []);
        } catch (err) {
            console.error("Failed to search users:", err);
            setAccessError(err?.message || "Failed to search users.");
        } finally {
            setAccessLoading(false);
        }
    };

    const handleGrantAccess = async (userId) => {
        try {
            setAccessError("");
            setAccessSuccess("");
            await grantProjectReadAccess(form.id, userId);
            setAccessSuccess(`Read-only access granted to ${userId}.`);
            await loadSharedUsers();
            await handleSearchUsers();
            if (onAccessChanged) await onAccessChanged();
        } catch (err) {
            console.error("Failed to grant access:", err);
            setAccessError(err?.message || "Failed to grant access.");
        }
    };

    const handleRevokeAccess = async (userId) => {
        try {
            setAccessError("");
            setAccessSuccess("");
            await revokeProjectReadAccess(form.id, userId);
            setAccessSuccess(`Access removed for ${userId}.`);
            await loadSharedUsers();
            await handleSearchUsers();
            if (onAccessChanged) await onAccessChanged();
        } catch (err) {
            console.error("Failed to revoke access:", err);
            setAccessError(err?.message || "Failed to revoke access.");
        }
    };

    // ═══════════════════════════════════════════════════
    //  DARK MODE STYLES
    // ═══════════════════════════════════════════════════
    const D = {
        overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(8px)" },
        panel: { background: "#111827", borderRadius: 14, border: "1px solid #1E2740", width: "100%", maxWidth: 600, maxHeight: "92vh", overflowY: "auto", position: "relative", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" },
        header: { padding: "22px 24px 0", position: "sticky", top: 0, background: "#111827", zIndex: 5, borderBottom: "1px solid #1E2740", paddingBottom: 0 },
        label: { fontSize: 11, color: "#4A5170", fontFamily: "'Inter', sans-serif", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6, display: "block" },
        input: { width: "100%", background: "#0B0D18", border: "1px solid #1E2740", borderRadius: 8, color: "#E8EAF2", padding: "10px 14px", fontSize: 13, fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" },
        accentColor: "#2979FF",
        alertColor: "#FF4B4B",
        textPrimary: "#E8EAF2",
        textSecondary: "#8B91A8",
        textMuted: "#4A5170",
        surface: "#0B0D18",
        border: "#1E2740",
        borderHover: "#2979FF40",
    };

    // ═══════════════════════════════════════════════════
    //  LIGHT MODE STYLES
    // ═══════════════════════════════════════════════════
    const L = {
        overlay: { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" },
        panel: { background: "#FFFFFF", borderRadius: 14, border: "1px solid #E5E7EB", width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto", position: "relative", boxShadow: "0 20px 60px rgba(15,23,42,0.16)" },
        header: { padding: "22px 28px 0", position: "sticky", top: 0, background: "#FFFFFF", zIndex: 5, borderBottom: "1px solid #E5E7EB", paddingBottom: 0 },
        label: { fontSize: 11, color: "#6B7280", fontFamily: "'Inter',sans-serif", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6, display: "block" },
        input: { width: "100%", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, color: "#111827", padding: "10px 14px", fontSize: 13, fontFamily: "'Inter',sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" },
        accentColor: "#2563EB",
        alertColor: "#DC2626",
        textPrimary: "#111827",
        textSecondary: "#374151",
        textMuted: "#6B7280",
        surface: "#F9FAFB",
        border: "#E5E7EB",
        borderHover: "#2563EB33",
    };
    const S = isDark ? D : L;
    const INP = S.input;
    const LBL = S.label;
    const filteredTech = TECH_LIST.filter((t) => t.label.toLowerCase().includes(techSearch.toLowerCase()));

    return (
        <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={S.panel}>

                {/* ── MODAL HEADER ── */}
                <div style={S.header}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, padding: isDark ? "0" : "0 0 0" }}>
                        <div>
                            {isDark ? (
                                <>
                                    <div style={{ fontSize: 11, color: S.accentColor, fontFamily: "'Inter', sans-serif", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 5, textTransform: "uppercase" }}>
                                        {isNew ? "New Mission" : "Edit Mission"}
                                    </div>
                                    <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: S.textPrimary }}>
                                        {form.title || "Untitled Project"}
                                    </h2>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontSize: 11, color: S.accentColor, fontFamily: "'Inter',sans-serif", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 5, textTransform: "uppercase" }}>
                                        {isNew ? "New Mission" : "Edit Mission"}
                                    </div>
                                    <h2 style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: S.textPrimary }}>
                                        {form.title || "Untitled Project"}
                                    </h2>
                                </>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: isDark ? "#1A2038" : "#F9FAFB",
                                border: `1px solid ${isDark ? "#1E2740" : "#E5E7EB"}`,
                                color: isDark ? "#8B91A8" : "#6B7280",
                                fontSize: isDark ? 14 : 16,
                                cursor: "pointer", padding: "5px 11px", borderRadius: isDark ? 8 : 5,
                                fontFamily: "'Inter',sans-serif",
                                transition: "all 0.15s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = S.alertColor; e.currentTarget.style.color = S.alertColor; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "#1E2740" : "#E5E7EB"; e.currentTarget.style.color = isDark ? "#8B91A8" : "#6B7280"; }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* ── TABS ── */}
                    <div style={{ display: "flex", gap: isDark ? 0 : 4, borderBottom: `1px solid ${S.border}` }}>
                        {tabs.map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                style={{
                                    background: tab === t ? (isDark ? "#1A2038" : "#EFF6FF") : "none",
                                    border: "none",
                                    padding: isDark ? "10px 16px" : "8px 14px",
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontFamily: "'Inter', sans-serif",
                                    letterSpacing: 0,
                                    fontWeight: tab === t ? 600 : 400,
                                    color: tab === t ? S.accentColor : S.textMuted,
                                    borderBottom: `2px solid ${tab === t ? S.accentColor : "transparent"}`,
                                    transition: "all 0.15s",
                                    textTransform: "capitalize",
                                    borderRadius: isDark ? "8px 8px 0 0" : "8px 8px 0 0",
                                }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ padding: isDark ? "20px 24px 28px" : "20px 28px 28px" }}>
                    {isReadOnly && (
                        <div style={{
                            marginBottom: 12,
                            border: `1px solid ${isDark ? "#1E2740" : "#E5E7EB"}`,
                            background: isDark ? "#0B0D18" : "#F9FAFB",
                            color: isDark ? "#8B91A8" : "#6B7280",
                            borderRadius: 8,
                            padding: "8px 10px",
                            fontSize: 12,
                            fontFamily: "'Inter',sans-serif",
                        }}>
                            Read-only mode: You can view this shared project, but cannot edit, upload, or delete.
                        </div>
                    )}

                    {/* ── OVERVIEW TAB ── */}
                    {tab === "overview" && (
                        <div style={{ display: "grid", gap: 16 }}>
                            <div>
                                <label style={LBL}>Project Title *</label>
                                <input
                                    style={INP}
                                    value={form.title}
                                    onChange={(e) => set("title", e.target.value)}
                                    placeholder="What are you building?"
                                    onFocus={e => e.currentTarget.style.borderColor = S.accentColor}
                                    onBlur={e => e.currentTarget.style.borderColor = S.border}
                                />
                            </div>
                            <div>
                                <label style={LBL}>Description</label>
                                <textarea
                                    style={{ ...INP, minHeight: 70, resize: "vertical" }}
                                    value={form.description}
                                    onChange={(e) => set("description", e.target.value)}
                                    placeholder="Brief overview of the project..."
                                    onFocus={e => e.currentTarget.style.borderColor = S.accentColor}
                                    onBlur={e => e.currentTarget.style.borderColor = S.border}
                                />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div>
                                    <label style={LBL}>Status</label>
                                    <select style={{ ...INP, cursor: "pointer", colorScheme: isDark ? "dark" : "light" }} value={form.status} onChange={(e) => set("status", e.target.value)}>
                                        {STATUSES.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={LBL}>Priority</label>
                                    <select style={{ ...INP, cursor: "pointer", colorScheme: isDark ? "dark" : "light" }} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                                        {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={LBL}>Deadline</label>
                                <input type="date" style={{ ...INP, colorScheme: isDark ? "dark" : "light" }} value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
                            </div>
                            <div>
                                <label style={LBL}>Repo Link (GitHub / GitLab)</label>
                                <input style={INP} value={form.repoLink} onChange={(e) => set("repoLink", e.target.value)} placeholder="https://github.com/you/project"
                                    onFocus={e => e.currentTarget.style.borderColor = S.accentColor}
                                    onBlur={e => e.currentTarget.style.borderColor = S.border}
                                />
                            </div>
                            {/* Deployment */}
                            <div>
                                <label style={LBL}>Deployment</label>
                                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                                    {[["live", "Live"], ["not-deployed", "Not Deployed"], ["custom", "Custom"]].map(([v, l]) => (
                                        <button
                                            key={v}
                                            onClick={() => set("deployStatus", v)}
                                            style={{
                                                flex: 1,
                                                background: form.deployStatus === v ? (isDark ? "rgba(41,121,255,0.15)" : S.accentColor) : S.surface,
                                                border: `1px solid ${form.deployStatus === v ? S.accentColor : S.border}`,
                                                color: form.deployStatus === v ? (isDark ? S.accentColor : "#fff") : S.textMuted,
                                                borderRadius: isDark ? 8 : 6, padding: "8px 0", cursor: "pointer",
                                                fontSize: 12,
                                                fontFamily: "'Inter', sans-serif",
                                                fontWeight: form.deployStatus === v ? 600 : 400,
                                                transition: "all 0.15s",
                                            }}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                                {form.deployStatus === "live" && (
                                    <input style={INP} value={form.deployLink} onChange={(e) => set("deployLink", e.target.value)} placeholder="https://yourapp.vercel.app"
                                        onFocus={e => e.currentTarget.style.borderColor = S.accentColor}
                                        onBlur={e => e.currentTarget.style.borderColor = S.border}
                                    />
                                )}
                                {form.deployStatus === "custom" && (
                                    <input style={INP} value={form.deployLabel} onChange={(e) => set("deployLabel", e.target.value)} placeholder="e.g. Desktop Only · Beta Testing"
                                        onFocus={e => e.currentTarget.style.borderColor = S.accentColor}
                                        onBlur={e => e.currentTarget.style.borderColor = S.border}
                                    />
                                )}
                            </div>
                            {/* Manual progress */}
                            {form.tasks.length === 0 && (
                                <div>
                                    <label style={LBL}>Progress — {form.progress}% (manual, add tasks to auto-calculate)</label>
                                    <input type="range" min={0} max={100} value={form.progress} onChange={(e) => set("progress", +e.target.value)} style={{ width: "100%", accentColor: S.accentColor }} />
                                </div>
                            )}
                            {/* Notes */}
                            <div>
                                <label style={LBL}>Notes</label>
                                <textarea style={{ ...INP, minHeight: 70, resize: "vertical" }} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Quick thoughts, blockers, ideas..."
                                    onFocus={e => e.currentTarget.style.borderColor = S.accentColor}
                                    onBlur={e => e.currentTarget.style.borderColor = S.border}
                                />
                            </div>
                            {/* Tags */}
                            <div>
                                <label style={LBL}>Tags</label>
                                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                                    <input style={{ ...INP, flex: 1 }} value={tagIn} onChange={(e) => setTagIn(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add tag + Enter"
                                        onFocus={e => e.currentTarget.style.borderColor = S.accentColor}
                                        onBlur={e => e.currentTarget.style.borderColor = S.border}
                                    />
                                    <button onClick={addTag} style={{ background: S.accentColor, border: "none", color: "#fff", borderRadius: isDark ? 8 : 6, padding: "0 14px", cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "'Inter',sans-serif" }}>+</button>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {form.tags.map((t) => (
                                        <span key={t} onClick={() => removeTag(t)} style={{
                                            fontSize: isDark ? 12 : 10,
                                            color: isDark ? "#8B91A8" : "#888",
                                            background: isDark ? "#1E2740" : "#ffffff08",
                                            border: `1px solid ${isDark ? "#232e48" : "#ffffff12"}`,
                                            padding: "3px 10px", borderRadius: isDark ? 6 : 3,
                                            cursor: "pointer", fontFamily: isDark ? "'Inter',sans-serif" : "'Orbitron',monospace",
                                            display: "inline-flex", alignItems: "center", gap: 6,
                                        }}>
                                            {t} <span style={{ color: S.alertColor, fontSize: 9 }}>✕</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TECH TAB ── */}
                    {tab === "tech" && (
                        <div>
                            <div style={{ marginBottom: 12 }}>
                                <label style={LBL}>Selected Stack</label>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, minHeight: 40, padding: "8px", background: S.surface, border: `1px solid ${S.border}`, borderRadius: isDark ? 8 : 7, marginBottom: 12 }}>
                                    {form.techStack.length === 0 && <span style={{ fontSize: isDark ? 12 : 10, color: S.textMuted, fontFamily: isDark ? "'Inter',sans-serif" : "'Orbitron',monospace" }}>No tech selected yet</span>}
                                    {form.techStack.map((t) => (
                                        <span key={t} onClick={() => toggleTech(t)} style={{ cursor: "pointer" }}>
                                            <TechBadge label={t} />
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <input style={{ ...INP, marginBottom: 10 }} value={techSearch} onChange={(e) => setTechSearch(e.target.value)} placeholder="Search tech stack..."
                                onFocus={e => e.currentTarget.style.borderColor = S.accentColor}
                                onBlur={e => e.currentTarget.style.borderColor = S.border}
                            />
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 6, maxHeight: 300, overflowY: "auto" }}>
                                {filteredTech.map((t) => {
                                    const sel = form.techStack.includes(t.label);
                                    return (
                                        <button
                                            key={t.label}
                                            onClick={() => toggleTech(t.label)}
                                            style={{
                                                background: sel ? t.color + "20" : S.surface,
                                                border: `1px solid ${sel ? t.color : isDark ? S.border : t.color + "30"}`,
                                                color: sel ? t.color : isDark ? S.textMuted : t.color + "80",
                                                borderRadius: isDark ? 8 : 6, padding: "8px 10px", cursor: "pointer",
                                                fontSize: isDark ? 12 : 10, fontFamily: isDark ? "'Inter',sans-serif" : "'Orbitron',monospace",
                                                letterSpacing: isDark ? 0 : 0.5,
                                                display: "flex", alignItems: "center", gap: 6,
                                                transition: "all 0.15s", textAlign: "left",
                                            }}
                                        >
                                            <span style={{ fontSize: 14 }}>{t.icon}</span>{t.label}
                                            {sel && <span style={{ marginLeft: "auto", fontSize: 9, color: t.color }}>✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── TASKS TAB ── */}
                    {tab === "tasks" && (
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <label style={{ ...LBL, margin: 0 }}>Tasks — {form.tasks.filter((t) => t.done).length}/{form.tasks.length} done</label>
                                {form.tasks.length > 0 && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <div style={{ width: 80, height: 4, background: isDark ? "#1E2740" : "#E5E7EB", borderRadius: 2, overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${prog}%`, background: S.accentColor, borderRadius: 2, transition: "width 0.4s" }} />
                                        </div>
                                        <span style={{ fontSize: 12, color: S.accentColor, fontFamily: "'Inter',sans-serif", fontWeight: 700 }}>{prog}%</span>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                                <input style={{ ...INP, flex: 1 }} value={taskIn} onChange={(e) => setTaskIn(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTask())} placeholder="New task + Enter"
                                    onFocus={e => e.currentTarget.style.borderColor = S.accentColor}
                                    onBlur={e => e.currentTarget.style.borderColor = S.border}
                                />
                                <button onClick={addTask} style={{ background: S.accentColor, border: "none", color: "#fff", borderRadius: isDark ? 8 : 6, padding: "0 14px", cursor: "pointer", fontWeight: 700, fontFamily: "'Inter',sans-serif", fontSize: 15 }}>+</button>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {form.tasks.length === 0 && <div style={{ textAlign: "center", padding: "30px 0", color: S.textMuted, fontFamily: isDark ? "'Inter',sans-serif" : "'Orbitron',monospace", fontSize: isDark ? 13 : 11 }}>No tasks yet</div>}
                                {form.tasks.map((task) => (
                                    <div key={task.id} style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        background: S.surface,
                                        border: `1px solid ${task.done ? (isDark ? "#00C89630" : "#00FF8830") : S.border}`,
                                        borderRadius: isDark ? 8 : 7, padding: "10px 12px", transition: "border-color 0.15s"
                                    }}>
                                        <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} style={{ accentColor: S.accentColor, width: 15, height: 15, cursor: "pointer", flexShrink: 0 }} />
                                        <span style={{ flex: 1, fontSize: isDark ? 13 : 13, color: task.done ? S.textMuted : S.textPrimary, textDecoration: task.done ? "line-through" : "none", fontFamily: isDark ? "'Inter',sans-serif" : "'Rajdhani',sans-serif" }}>{task.text}</span>
                                        {task.done && <span style={{ fontSize: 10, color: isDark ? "#00C896" : "#059669", fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>Done</span>}
                                        <button onClick={() => removeTask(task.id)} style={{ background: "none", border: "none", color: S.textMuted, cursor: "pointer", fontSize: 12, padding: 2 }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── DOCS TAB ── */}
                    {tab === "docs" && (
                        <div>
                            <label style={LBL}>Attachments</label>
                            <div
                                onClick={() => fileRef.current?.click()}
                                style={{
                                    border: `1px dashed ${isDark ? "#2979FF40" : "#2563EB40"}`,
                                    borderRadius: isDark ? 10 : 8,
                                    padding: "28px 24px", textAlign: "center",
                                    cursor: "pointer", marginBottom: 16,
                                    background: S.surface, transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = isDark ? "#2979FF90" : "#2563EB80")}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = isDark ? "#2979FF40" : "#2563EB40")}
                            >
                                <div style={{ fontSize: 26, marginBottom: 8 }}>📎</div>
                                <div style={{ fontSize: isDark ? 13 : 11, color: S.textSecondary, fontFamily: isDark ? "'Inter',sans-serif" : "'Orbitron',monospace", fontWeight: isDark ? 500 : 400 }}>Click to upload</div>
                                <div style={{ fontSize: 11, color: S.textMuted, marginTop: 4, fontFamily: "'Inter',sans-serif" }}>PDF · Images · Word Docs · max 4MB each</div>
                                <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.txt,.md" style={{ display: "none" }} onChange={handleFileUpload} />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {form.docs?.length === 0 && <div style={{ textAlign: "center", padding: "20px 0", color: S.textMuted, fontFamily: isDark ? "'Inter',sans-serif" : "'Orbitron',monospace", fontSize: isDark ? 13 : 10 }}>No docs attached</div>}
                                {form.docs?.map((doc) => {
                                    const isImg = doc.type?.startsWith("image/");
                                    const isPdf = doc.type === "application/pdf";
                                    const size = doc.size > 1024 * 1024 ? (doc.size / 1024 / 1024).toFixed(1) + "MB" : (doc.size / 1024).toFixed(0) + "KB";
                                    return (
                                        <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 10, background: S.surface, border: `1px solid ${S.border}`, borderRadius: isDark ? 8 : 7, padding: "10px 14px" }}>
                                            <span style={{ fontSize: 18 }}>{isImg ? "🖼️" : isPdf ? "📄" : "📝"}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: isDark ? 13 : 12, color: S.textPrimary, fontFamily: isDark ? "'Inter',sans-serif" : "'Rajdhani',sans-serif", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.name}</div>
                                                <div style={{ fontSize: 10, color: S.textMuted, fontFamily: isDark ? "'Inter',sans-serif" : "'Orbitron',monospace" }}>{size} · {fmtTime(doc.uploadedAt)}</div>
                                            </div>
                                            <button onClick={() => viewDoc(doc)} style={{ background: isDark ? "rgba(41,121,255,0.15)" : "#EFF6FF", border: `1px solid ${isDark ? "#2979FF40" : "#BFDBFE"}`, color: isDark ? "#5B9EFF" : "#2563EB", borderRadius: isDark ? 6 : 6, padding: "4px 10px", cursor: "pointer", fontSize: 12, fontFamily: "'Inter',sans-serif" }}>View</button>
                                            <button onClick={() => removeDoc(doc.id)} style={{ background: "none", border: "none", color: S.textMuted, cursor: "pointer", fontSize: 14, padding: 2 }}>✕</button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── ACTIVITY TAB ── */}
                    {tab === "activity" && (
                        <div>
                            <label style={LBL}>Activity Log</label>
                            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                                {(!form.activityLog || form.activityLog.length === 0) && (
                                    <div style={{ textAlign: "center", padding: "30px 0", color: S.textMuted, fontFamily: isDark ? "'Inter',sans-serif" : "'Orbitron',monospace", fontSize: isDark ? 13 : 10 }}>No activity yet</div>
                                )}
                                {[...(form.activityLog || [])].reverse().map((entry, i) => (
                                    <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: `1px solid ${isDark ? "#1E2740" : "#F3F4F6"}` }}>
                                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: S.accentColor, marginTop: 5, flexShrink: 0, boxShadow: `0 0 6px ${S.accentColor}` }} />
                                        <div>
                                            <div style={{ fontSize: isDark ? 13 : 12, color: S.textPrimary, fontFamily: isDark ? "'Inter',sans-serif" : "'Rajdhani',sans-serif", lineHeight: 1.4 }}>{entry.action}</div>
                                            <div style={{ fontSize: 10, color: S.textMuted, fontFamily: isDark ? "'Inter',sans-serif" : "'Orbitron',monospace", marginTop: 2 }}>{fmtTime(entry.ts)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── ACCESS TAB ── */}
                    {tab === "access" && canManageAccess && !isNew && (
                        <div style={{ display: "grid", gap: 14 }}>
                            <div>
                                <label style={LBL}>Grant Read-Only Access</label>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <input
                                        style={{ ...INP, flex: 1 }}
                                        value={accessQuery}
                                        onChange={(e) => setAccessQuery(e.target.value)}
                                        placeholder="Type user ID (prefix search)..."
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleSearchUsers();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={handleSearchUsers}
                                        disabled={accessLoading}
                                        style={{
                                            background: S.accentColor,
                                            border: "none",
                                            color: "#fff",
                                            borderRadius: isDark ? 8 : 6,
                                            padding: "0 14px",
                                            cursor: "pointer",
                                            fontSize: 12,
                                            fontFamily: "'Inter',sans-serif",
                                            fontWeight: 600,
                                            opacity: accessLoading ? 0.75 : 1,
                                        }}
                                    >
                                        {accessLoading ? "Searching..." : "Search"}
                                    </button>
                                </div>
                            </div>

                            {accessError && (
                                <div style={{ fontSize: 12, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 10px" }}>
                                    {accessError}
                                </div>
                            )}
                            {accessSuccess && (
                                <div style={{ fontSize: 12, color: "#065F46", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, padding: "8px 10px" }}>
                                    {accessSuccess}
                                </div>
                            )}

                            <div>
                                <label style={LBL}>Search Results</label>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {accessResults.length === 0 ? (
                                        <div style={{ fontSize: 12, color: S.textMuted }}>No matching users yet.</div>
                                    ) : (
                                        accessResults.map((user) => (
                                            <div key={user.userId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, border: `1px solid ${S.border}`, background: S.surface, borderRadius: 8, padding: "8px 10px" }}>
                                                <div>
                                                    <div style={{ fontSize: 13, color: S.textPrimary, fontWeight: 600 }}>{user.displayName || user.userId}</div>
                                                    <div style={{ fontSize: 11, color: S.textMuted }}>{user.userId} · {user.role}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleGrantAccess(user.userId)}
                                                    disabled={user.hasAccess}
                                                    style={{
                                                        background: user.hasAccess ? (isDark ? "#1E2740" : "#E5E7EB") : S.accentColor,
                                                        border: "none",
                                                        color: user.hasAccess ? S.textMuted : "#fff",
                                                        borderRadius: 6,
                                                        padding: "6px 10px",
                                                        cursor: user.hasAccess ? "not-allowed" : "pointer",
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {user.hasAccess ? "Already Granted" : "Grant"}
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div>
                                <label style={LBL}>Users With Access</label>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {sharedUsers.length === 0 ? (
                                        <div style={{ fontSize: 12, color: S.textMuted }}>No users have access yet.</div>
                                    ) : (
                                        sharedUsers.map((user) => (
                                            <div key={user.userId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, border: `1px solid ${S.border}`, background: S.surface, borderRadius: 8, padding: "8px 10px" }}>
                                                <div>
                                                    <div style={{ fontSize: 13, color: S.textPrimary, fontWeight: 600 }}>{user.displayName || user.userId}</div>
                                                    <div style={{ fontSize: 11, color: S.textMuted }}>
                                                        {user.userId} · {user.accessLevel} · granted by {user.grantedByUserId}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRevokeAccess(user.userId)}
                                                    style={{
                                                        background: isDark ? "rgba(255,75,75,0.08)" : "#FEE2E2",
                                                        border: `1px solid ${isDark ? "rgba(255,75,75,0.3)" : "#FCA5A5"}`,
                                                        color: isDark ? "#FF4B4B" : "#DC2626",
                                                        borderRadius: 6,
                                                        padding: "6px 10px",
                                                        cursor: "pointer",
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    Revoke
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ACTION BUTTONS ── */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: `1px solid ${isDark ? "#1E2740" : "#ffffff08"}` }}>
                        <div>
                            {!isNew && !isReadOnly && (
                                <button onClick={() => onDelete(project.id)} style={{
                                    background: isDark ? "rgba(255,75,75,0.08)" : "#FEE2E2",
                                    border: `1px solid ${isDark ? "rgba(255,75,75,0.3)" : "#FCA5A5"}`,
                                    color: isDark ? "#FF4B4B" : "#DC2626",
                                    borderRadius: isDark ? 8 : 7, padding: "10px 18px", cursor: "pointer",
                                    fontSize: 13,
                                    fontFamily: "'Inter',sans-serif",
                                    fontWeight: 500,
                                    letterSpacing: 0,
                                    transition: "all 0.15s",
                                }}>
                                    Delete
                                </button>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={onClose} style={{
                                background: "none",
                                border: `1px solid ${isDark ? "#1E2740" : "#E5E7EB"}`,
                                color: isDark ? "#4A5170" : "#6B7280",
                                borderRadius: isDark ? 8 : 7, padding: "10px 18px", cursor: "pointer",
                                fontSize: 13,
                                fontFamily: "'Inter',sans-serif",
                                letterSpacing: 0,
                            }}>
                                Cancel
                            </button>
                            {!isReadOnly && (
                                <button onClick={handleSave} style={{
                                    background: isDark ? "#2979FF" : S.accentColor,
                                    border: "none", color: "#fff",
                                    borderRadius: isDark ? 8 : 7, padding: "10px 24px", cursor: "pointer",
                                    fontSize: 13,
                                    fontFamily: "'Inter',sans-serif",
                                    fontWeight: 700,
                                    letterSpacing: 0,
                                    boxShadow: isDark ? "0 4px 16px rgba(41,121,255,0.35)" : "0 4px 16px rgba(37,99,235,0.22)",
                                    transition: "all 0.15s",
                                }}
                                    onMouseEnter={e => { if (isDark) e.currentTarget.style.filter = "brightness(1.1)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.filter = ""; }}
                                >
                                    {isNew ? "Create Project" : "Save Changes"}
                                </button>
                            )}
                            {isReadOnly && (
                                <button style={{
                                    background: isDark ? "#1E2740" : "#E5E7EB",
                                    border: "none",
                                    color: isDark ? "#8B91A8" : "#6B7280",
                                    borderRadius: isDark ? 8 : 7,
                                    padding: "10px 16px",
                                    cursor: "not-allowed",
                                    fontSize: 12,
                                    fontFamily: "'Inter',sans-serif",
                                    fontWeight: 600,
                                }}>
                                    Read-only project
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

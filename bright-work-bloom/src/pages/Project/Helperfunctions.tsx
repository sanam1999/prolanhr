import { useState, useEffect, useRef } from "react";
import { Project, RawProject, RawEmployee, Employee } from '../../types/project.types'
import { c } from '../../colors/color'
import { toast } from "../../hooks/use-toast";

const RING_R = 50;
const RING_STROKE = 8;
const RING_SIZE = (RING_R + RING_STROKE) * 2 + 3;

export function normaliseProject(r: RawProject): Project {
    return {
        id: String(r._id),
        name: r.name,
        pct: r.progress ?? 0,
        employeeid: r.employeeid ?? [],
    };
}

export function normaliseEmployee(
    r: RawEmployee,
    deptMap: Record<string, string>
): Employee {
    const deptKey = String(r.department).trim();
    return {
        id: String(r._id).trim(),
        name: r.fullName,
        email: r.email,
        role: r.role ?? r.position ?? r.jobTitle ?? "—",
        department: deptKey,
        departmentName: deptMap[deptKey] ?? "—",
        status: r.status ?? "active",
        joinDate: r.joinDate ?? "",
    };
}
export function ProjectMenu({
    project,
    onEdit,
    onDelete,
}: {
    project: Project;
    onEdit: (p: Project) => void;
    onDelete: (id: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handle(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    return (
        <div ref={ref} style={{ position: "relative" }}>
            {/* Dot button */}
            <button
                onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
                title="Options"
                style={{
                    background: open ? c.ACCENT_LT : "transparent",
                    border: `1px solid ${open ? "#a8d5c0" : "transparent"}`,
                    borderRadius: "50%",
                    width: 26,
                    height: 26,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    transition: "background 0.15s, border-color 0.15s",
                    color: open ? c.ACCENT : c.TEXT3,
                    flexShrink: 0,
                }}
            >
                {/* Three vertical dots */}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <circle cx="7" cy="2.5" r="1.3" />
                    <circle cx="7" cy="7" r="1.3" />
                    <circle cx="7" cy="11.5" r="1.3" />
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: c.WHITE,
                        border: `1px solid ${c.DIVIDER}`,
                        borderRadius: 10,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                        minWidth: 130,
                        zIndex: 100,
                        overflow: "hidden",
                    }}
                >
                    {/* Edit */}
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            setOpen(false);
                            onEdit(project);
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            width: "100%",
                            padding: "10px 14px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: c.f,
                            fontSize: 13,
                            fontWeight: 500,
                            color: c.TEXT2,
                            textAlign: "left",
                            transition: "background 0.1s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = c.ACCENT_LT)}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={c.ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9.5 1.5l2 2-7 7H2.5v-2l7-7z" />
                        </svg>
                        Edit Name
                    </button>

                    <div style={{ height: 1, background: c.DIVIDER, margin: "0 10px" }} />

                    {/* Delete */}
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            setOpen(false);
                            onDelete(project.id);
                            toast({ title: "Success", description: "Project deleted" });
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            width: "100%",
                            padding: "10px 14px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: c.f,
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#c0392b",
                            textAlign: "left",
                            transition: "background 0.1s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#fff0f0")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                    >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#c0392b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1 3 12 3" />
                            <path d="M4 3V2h5v1" />
                            <path d="M2 3l1 9h7l1-9" />
                        </svg>
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}

export function RingChart({
    label,
    pct,
    project,
    onEdit,
    onDelete,
}: {
    label: string;
    pct: number;
    project: Project;
    onEdit: (p: Project) => void;
    onDelete: (id: string) => void;
}) {
    const cx = RING_SIZE / 2;
    const cy = RING_SIZE / 2;
    const circ = 2 * Math.PI * RING_R;
    const filled = (Math.min(pct, 100) / 100) * circ;

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            {/* Ring SVG */}
            <svg
                width={RING_SIZE}
                height={RING_SIZE}
                viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
                style={{ overflow: "visible" }}
            >
                <circle cx={cx} cy={cy} r={RING_R} fill="none" stroke={c.RING_TRACK} strokeWidth={RING_STROKE} />
                <circle
                    cx={cx} cy={cy} r={RING_R}
                    fill="none" stroke={c.RING_COLOR}
                    strokeWidth={RING_STROKE} strokeLinecap="round"
                    strokeDasharray={`${filled} ${circ}`}
                    transform={`rotate(-90 ${cx} ${cy})`}
                    style={{ transition: "stroke-dasharray 0.5s ease" }}
                />
                <text
                    x={cx} y={cy}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={14} fontWeight={700} fontFamily={c.mono} fill={c.RING_COLOR}
                >
                    {pct}%
                </text>
            </svg>

            {/* Label row: name + 3-dot menu */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                maxWidth: RING_SIZE + 30,
                justifyContent: "center",
            }}>
                <span style={{
                    fontFamily: c.mono, fontSize: 10, fontWeight: 500, color: c.TEXT3,
                    textTransform: "uppercase" as const, textAlign: "center" as const,
                    letterSpacing: "0.07em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap" as const,
                    maxWidth: RING_SIZE,
                }}>
                    {label}
                </span>

                <ProjectMenu project={project} onEdit={onEdit} onDelete={onDelete} />
            </div>
        </div>
    );
}

const inputSt: React.CSSProperties = {
    fontFamily: c.f, fontSize: 13, fontWeight: 400,
    padding: "8px 12px", border: `1px solid ${c.DIVIDER}`,
    borderRadius: 8, background: c.WHITE, color: c.TEXT2,
    outline: "none", width: "100%", boxSizing: "border-box" as const,
};


export function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            fontFamily: c.mono, fontSize: 15, fontWeight: 600, color: c.TEXT3,
            textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14,
        }}>
            {children}
        </div>
    );
}

export function Av({ name, size = 28 }: { name: string; size?: number }) {
    const ini = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    return (
        <div style={{
            width: size, height: size, borderRadius: "50%",
            background: c.ACCENT_LT, color: c.ACCENT,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: c.f, fontWeight: 700, fontSize: size * 0.34, flexShrink: 0,
        }}>
            {ini}
        </div>
    );
}

export function EditModal({
    project,
    onClose,
    onSave,
}: {
    project: Project;
    onClose: () => void;
    onSave: (id: string, newName: string) => Promise<void>;
}) {
    const [name, setName] = useState(project.name);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim() || name.trim() === project.name) { onClose(); return; }
        setSaving(true);
        await onSave(project.id, name.trim());
        setSaving(false);
        onClose();
    };

    return (
        /* Backdrop */
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 200,
            }}
        >
            {/* Modal card */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: c.WHITE,
                    border: `1px solid ${c.DIVIDER}`,
                    borderRadius: 16,
                    padding: "24px 28px",
                    width: 340,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
                }}
            >
                <div style={{ fontFamily: c.mono, fontSize: 13, fontWeight: 600, color: c.TEXT3, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
                    Edit Project Name
                </div>

                <input
                    autoFocus
                    style={{ ...inputSt, marginBottom: 16 }}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSave()}
                    placeholder="Project name"
                />

                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: "10px 0",
                            background: c.BG, border: `1px solid ${c.DIVIDER}`,
                            borderRadius: 8, fontFamily: c.f, fontSize: 13,
                            fontWeight: 600, color: c.TEXT3, cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        style={{
                            flex: 1, padding: "10px 0",
                            background: (!name.trim() || saving) ? c.DIVIDER : c.ACCENT,
                            color: (!name.trim() || saving) ? c.TEXT3 : c.WHITE,
                            border: "none", borderRadius: 8,
                            fontFamily: c.f, fontSize: 13, fontWeight: 600,
                            cursor: (!name.trim() || saving) ? "not-allowed" : "pointer",
                            transition: "background 0.15s",
                        }}
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
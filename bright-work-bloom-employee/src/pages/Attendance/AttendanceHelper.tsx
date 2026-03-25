// src/pages/AttendanceHelper.tsx
import { useState } from "react";
import {
    ChevronRight, ChevronDown, Clock, Trash,
    Plus, X, CheckCircle2, Lock
} from "lucide-react";
import { C } from "../../colors/color";
import { AttendanceRecord, SlotState } from "@/types/project.types";

export const LOG_SLOTS = [
    { label: "10:00 AM", hour: 10, minute: 0 },
    { label: "12:00 PM", hour: 12, minute: 0 },
    { label: "02:00 PM", hour: 14, minute: 0 },
    { label: "04:00 PM", hour: 16, minute: 0 },
];


export function LogSlotButton({ slot, state, onClick }: {
    slot: typeof LOG_SLOTS[0];
    state: SlotState;
    onClick: () => void;
}) {
    const configs = {
        upcoming: { bg: C.pageBg, border: C.border, color: C.sub, icon: Clock, label: "Upcoming", clickable: false },
        open: { bg: C.primary, border: C.primary, color: "#fff", icon: Plus, label: "Add Log", clickable: true },
        closed: { bg: "#fee2e210", border: "#ef444440", color: "#ef4444", icon: Lock, label: "Closed", clickable: false },
        done: { bg: `${C.primary}12`, border: C.primary, color: C.primary, icon: CheckCircle2, label: "Done", clickable: false },
    };
    const cfg = configs[state];
    const Icon = cfg.icon;

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <button
                onClick={cfg.clickable ? onClick : undefined}
                disabled={!cfg.clickable}
                style={{
                    width: 52, height: 52, borderRadius: 14,
                    backgroundColor: cfg.bg,
                    border: `1.5px solid ${cfg.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: cfg.clickable ? "pointer" : "not-allowed",
                    transition: "all 0.15s",
                    boxShadow: state === "open" ? `0 4px 14px ${C.primary}44` : "none",
                }}
            >
                <Icon size={18} color={cfg.color} />
            </button>
            <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color, letterSpacing: "0.02em" }}>
                {slot.label}
            </span>
            <span style={{ fontSize: 9, color: C.sub }}>{cfg.label}</span>
        </div>
    );
}

export function getSlotState(slot: typeof LOG_SLOTS[0], now: Date, submittedSlots: Set<string>): SlotState {
    const key = `${slot.hour}:${slot.minute}`;
    if (submittedSlots.has(key)) return "done";

    const slotStart = new Date(now);
    slotStart.setHours(slot.hour, slot.minute, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slot.minute + 30);

    if (now < slotStart) return "upcoming";
    if (now >= slotStart && now < slotEnd) return "open";
    return "closed";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
};

export const fmtTime = (iso: string) => {
    return iso.split('T')[1].substring(0, 5);
}

export const statusColor: Record<string, { text: string; bg: string }> = {
    present: { text: C.primary, bg: `${C.primary}18` },
    late: { text: "#f59e0b", bg: "#fef3c718" },
    absent: { text: "#ef4444", bg: "#fee2e218" },
    "on-leave": { text: "#8b5cf6", bg: "#ede9fe18" },
    "half-day": { text: "#f97316", bg: "#fff7ed18" },
};

// ─── Daily Log Row ────────────────────────────────────────────────────────────
export function DailyLogRow({ record, onDelete }: {
    record: AttendanceRecord;
    onDelete: (recordId: string, logIndex: number) => void;
}) {
    const [open, setOpen] = useState(false);
    const sc = statusColor[record.status] ?? statusColor.present;

    return (
        <div style={{
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 14, overflow: "hidden",
        }}>
            {/* Row header */}
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 18px", cursor: "pointer",
                }}
            >
                {/* Toggle icon */}
                <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    backgroundColor: C.pageBg, border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                    {open
                        ? <ChevronDown size={14} color={C.sub} />
                        : <ChevronRight size={14} color={C.sub} />
                    }
                </div>

                {/* Date + meta */}
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: "monospace" }}>
                        {fmtDate(record.date)}
                    </p>
                    <p style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                        {record.checkIn ? fmtTime(record.checkIn) : "—"}
                        {" → "}
                        {record.checkOut ? fmtTime(record.checkOut) : "—"}
                        {" · "}
                        {record.logs.length} {record.logs.length === 1 ? "task" : "tasks"}
                    </p>
                </div>

                {/* Status + entries */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                        fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
                        backgroundColor: sc.bg, color: sc.text, textTransform: "capitalize",
                    }}>
                        {record.status}
                    </span>
                    <span style={{
                        fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
                        backgroundColor: `${C.primary}12`, color: C.primary,
                    }}>
                        {record.logs.length} entries
                    </span>
                </div>
            </div>

            {/* Expanded logs */}
            {open && (
                <div style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.pageBg }}>
                    {record.logs.length === 0 ? (
                        <p style={{ padding: "14px 20px", fontSize: 12, color: C.sub, fontStyle: "italic" }}>
                            No log entries for this day.
                        </p>
                    ) : (
                        record.logs.map((log, i) => (
                            <div key={i} style={{
                                display: "flex", alignItems: "flex-start", gap: 16,
                                padding: "12px 20px",
                                borderBottom: i < record.logs.length - 1 ? `1px solid ${C.border}` : "none",
                            }}>
                                <span style={{
                                    fontSize: 11, fontWeight: 700, color: C.primary,
                                    fontFamily: "monospace", flexShrink: 0, marginTop: 1,
                                    minWidth: 70,
                                }}>
                                    {fmtTime(log.time)}
                                </span>
                                <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{log.log}</span>
                                <Trash
                                    size={15}
                                    color={C.error}
                                    style={{ flexShrink: 0, cursor: "pointer", marginTop: 2 }}
                                    onClick={e => {
                                        e.stopPropagation();
                                        onDelete(record._id, i);
                                    }}
                                />
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Log Entry Modal ──────────────────────────────────────────────────────────
export function LogModal({ slotLabel, onClose, onSubmit, loading }: {
    slotLabel: string;
    onClose: () => void;
    onSubmit: (log: string) => Promise<void>;
    loading: boolean;
}) {
    const [log, setNote] = useState("");

    return (
        <div style={{
            position: "fixed", inset: 0, backgroundColor: "#00000044",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 20,
        }}>
            <div style={{
                background: C.bg, borderRadius: 20, padding: 28,
                width: "100%", maxWidth: 400,
                border: `1px solid ${C.border}`,
                boxShadow: "0 20px 60px #00000018",
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <div>
                        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>
                            Add Log · {slotLabel}
                        </h2>
                        <p style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>What did you work on?</p>
                    </div>
                    <button onClick={onClose} style={{
                        width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`,
                        background: C.pageBg, cursor: "pointer", color: C.sub,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <X size={14} />
                    </button>
                </div>

                <textarea
                    value={log}
                    onChange={e => setNote(e.target.value)}
                    placeholder="e.g. Completed API integration for auth module..."
                    autoFocus
                    rows={4}
                    style={{
                        width: "100%", padding: "12px", borderRadius: 10,
                        border: `1px solid ${C.border}`, background: C.pageBg,
                        fontSize: 13, color: C.text, resize: "none", outline: "none",
                        boxSizing: "border-box", lineHeight: 1.6,
                    }}
                />

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <button onClick={onClose} style={{
                        flex: 1, padding: "10px", borderRadius: 10,
                        border: `1px solid ${C.border}`, background: C.pageBg,
                        fontSize: 13, fontWeight: 600, color: C.sub, cursor: "pointer",
                    }}>
                        Cancel
                    </button>
                    <button
                        onClick={() => log.trim() && onSubmit(log.trim())}
                        disabled={!log.trim() || loading}
                        style={{
                            flex: 2, padding: "10px", borderRadius: 10, border: "none",
                            backgroundColor: log.trim() ? C.primary : C.border,
                            color: "#fff", fontSize: 13, fontWeight: 600,
                            cursor: log.trim() && !loading ? "pointer" : "not-allowed",
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? "Saving..." : "Save Log"}
                    </button>
                </div>
            </div>
        </div>
    );
}
import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { toast } from "../hooks/use-toast";

const token = localStorage.getItem("token");

// ── Google Fonts loader ──────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

// ── Types ─────────────────────────────────────────────────────────────────────
type Status = "active" | "on-leave" | "inactive";

interface Employee {
    _id: string;
    name: string;
    avatar: string;
    role: string;
    department: string;
    status: Status;
    join: string;
    task: string;
}

const DEPARTMENTS = ["Software Engineering Department", "AI & Research Department", "Cybersecurity Department", "Project Management Office(PMO)", "Marketing & Branding", "Administration & Finance"];

// ── Status badge ─────────────────────────────────────────────────────────────
const tagStyles: Record<Status, React.CSSProperties> = {
    active: { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" },
    "on-leave": { background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a" },
    inactive: { background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" },
};

function StatusTag({ status }: { status: Status }) {
    const label = status === "on-leave" ? "On Leave" : status.charAt(0).toUpperCase() + status.slice(1);
    return (
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.3px",
            width: "fit-content",
            ...tagStyles[status],
        }}>
            {label}
        </span>
    );
}


// ── Main component ────────────────────────────────────────────────────────────
export default function TeamTrack() {
    const navigate = useNavigate();

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");

    const [dept, setDept] = useState("");

    // ── Fetch from backend ────────────────────────────────────────────────────
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teamtrack`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                });
                if (res.status === 402) {
                    navigate("/unauthorized", { replace: true });
                    return; // ← stop execution after redirect
                }
                if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
                const data: Employee[] = await res.json();
                setEmployees(data);
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to fetch employees";
                setError(msg);
                toast({ title: "Error", description: msg, variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    const handleEmployeeClick = (id: string) => navigate(`/workflow/${id}`);

    const todayStr = new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const filtered = useMemo(() => employees.filter(e => {
        if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (dept && e.department !== dept) return false;

        return true;
    }), [employees, search, dept]);

    const activeToday = filtered.filter(e => e.status === "active");

    // ── Shared styles ─────────────────────────────────────────────────────────
    const BASE: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

    const inputStyle: React.CSSProperties = {
        ...BASE,
        fontSize: 13,
        fontWeight: 400,
        padding: "8px 12px",
        border: "1px solid #d1d5db",
        borderRadius: 8,
        background: "#fff",
        color: "#111827",
        outline: "none",
        height: 38,
        lineHeight: "1.4",
    };

    const labelStyle: React.CSSProperties = {
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        fontWeight: 500,
        color: "#9ca3af",
        textTransform: "uppercase" as const,
        letterSpacing: "0.8px",
    };

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) return (
        <AppLayout title="Team Track">
            <div style={{
                ...BASE,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                background: "#f4f6f8",
                gap: 12,
            }}>
                <div style={{
                    width: 32, height: 32,
                    border: "3px solid #e5e7eb",
                    borderTop: "3px solid #0f766e",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <span style={{ fontSize: 13, color: "#9ca3af", fontFamily: "'DM Mono', monospace" }}>
                    Loading employees…
                </span>
            </div>
        </AppLayout>
    );

    // ── Error state ───────────────────────────────────────────────────────────
    if (error) return (
        <AppLayout title="Team Track">
            <div style={{
                ...BASE,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                background: "#f4f6f8",
                gap: 12,
            }}>
                <div style={{
                    background: "#fff",
                    border: "1px solid #fecaca",
                    borderRadius: 12,
                    padding: "24px 32px",
                    textAlign: "center",
                    maxWidth: 400,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#dc2626", marginBottom: 6 }}>
                        Failed to load employees
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af", fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
                        {error}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: "#134e4a",
                            color: "#fff",
                            border: "none",
                            padding: "8px 20px",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        </AppLayout>
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <AppLayout title="Team Track">
            <div style={{ ...BASE, background: "#f4f6f8", minHeight: "100vh", padding: "28px 32px", color: "#111827" }}>

                {/* Top bar */}
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 22,
                        fontWeight: 700,
                        color: "#111827",
                        letterSpacing: "-0.4px",
                        margin: 0,
                    }}>
                        TeamTrack
                    </h1>
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "flex-end" }}>

                    {/* Search */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <label style={labelStyle}>Search by name</label>
                        <input
                            type="text"
                            placeholder="Search employees…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ ...inputStyle, width: 220 }}
                        />
                    </div>

                    {/* Department */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <label style={labelStyle}>Department</label>
                        <select
                            value={dept}
                            onChange={e => setDept(e.target.value)}
                            style={{ ...inputStyle, width: 175, cursor: "pointer" }}
                        >
                            <option value="">All Departments</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                {/* Layout */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

                    {/* ── Employee list ── */}
                    <div style={{
                        background: "#fff",
                        borderRadius: 14,
                        border: "1px solid #e5e7eb",
                        overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    }}>
                        {/* Table header */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "2.5fr 1.4fr 1fr",
                            padding: "11px 20px",
                            background: "#f9fafb",
                            borderBottom: "1px solid #e5e7eb",
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 10,
                            fontWeight: 500,
                            color: "#9ca3af",
                            textTransform: "uppercase",
                            letterSpacing: "0.7px",
                        }}>
                            <span>Employee</span>
                            <span>Department</span>
                            <span>Status</span>
                        </div>

                        {/* Rows */}
                        {filtered.length === 0 ? (
                            <div style={{ ...BASE, padding: 48, textAlign: "center", fontSize: 13, fontWeight: 400, color: "#9ca3af" }}>
                                No employees match your filters.
                            </div>
                        ) : (
                            filtered.map((e, i) => (
                                <div
                                    key={e._id}
                                    onClick={() => handleEmployeeClick(e._id)}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "2.5fr 1.4fr 1fr",
                                        padding: "13px 20px",
                                        borderBottom: i === filtered.length - 1 ? "none" : "1px solid #f3f4f6",
                                        alignItems: "center",
                                        cursor: "pointer",
                                        transition: "background 0.12s",
                                    }}
                                    onMouseEnter={el => (el.currentTarget.style.background = "#f0fdfa")}
                                    onMouseLeave={el => (el.currentTarget.style.background = "transparent")}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div className="shrink-0 h-10 w-10 rounded-full overflow-hidden bg-primary/10">
                                            <img src={e.avatar} alt="avatar" className="h-full w-full object-cover" />
                                        </div>
                                        <div>
                                            <div style={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: "#111827",
                                                letterSpacing: "-0.1px",
                                                lineHeight: 1.3,
                                            }}>
                                                {e.name}
                                            </div>
                                            <div style={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: 12,
                                                fontWeight: 400,
                                                color: "#9ca3af",
                                                lineHeight: 1.4,
                                                marginTop: 1,
                                            }}>
                                                {e.role}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: 13,
                                        fontWeight: 400,
                                        color: "#374151",
                                    }}>
                                        {e.department}
                                    </span>
                                    <StatusTag status={e.status} />
                                </div>
                            ))
                        )}
                    </div>

                    {/* ── Today panel ── */}
                    <div style={{
                        background: "#fff",
                        borderRadius: 14,
                        padding: 20,
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                        position: "sticky",
                        top: 28,
                        maxHeight: "calc(100vh - 60px)",
                        overflowY: "auto",
                    }}>
                        {/* Panel header */}
                        <div style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 9,
                            fontWeight: 500,
                            textTransform: "uppercase",
                            letterSpacing: "1.4px",
                            color: "#9ca3af",
                            marginBottom: 4,
                        }}>
                            Today
                        </div>
                        <div style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#111827",
                            letterSpacing: "-0.1px",
                            marginBottom: 16,
                            paddingBottom: 14,
                            borderBottom: "1px solid #f3f4f6",
                            lineHeight: 1.4,
                        }}>
                            {todayStr}
                        </div>

                        <div style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: 9,
                            fontWeight: 500,
                            textTransform: "uppercase",
                            letterSpacing: "1.2px",
                            color: "#9ca3af",
                            marginBottom: 12,
                        }}>
                            All Active Employees
                        </div>

                        {activeToday.length === 0 ? (
                            <div style={{ ...BASE, fontSize: 12, fontWeight: 400, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>
                                No active employees
                            </div>
                        ) : (
                            activeToday.map(e => (
                                <div
                                    key={e._id}
                                    onClick={() => handleEmployeeClick(e._id)}
                                    style={{
                                        border: "1px solid #e5e7eb",
                                        borderRadius: 10,
                                        padding: "11px 13px",
                                        marginBottom: 9,
                                        cursor: "pointer",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={el => (el.currentTarget.style.background = "#f9fafb")}
                                    onMouseLeave={el => (el.currentTarget.style.background = "transparent")}
                                >
                                    {/* Card header */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                        <div className="shrink-0 h-10 w-10 rounded-full overflow-hidden bg-primary/10">
                                            <img src={e.avatar} alt="avatar" className="h-full w-full object-cover" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: "#111827",
                                                letterSpacing: "-0.1px",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                lineHeight: 1.3,
                                            }}>
                                                {e.name}
                                            </div>
                                            <div style={{
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: 11,
                                                fontWeight: 400,
                                                color: "#9ca3af",
                                                marginTop: 1,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                lineHeight: 1.4,
                                            }}>
                                                {e.role}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(ev) => { ev.stopPropagation(); handleEmployeeClick(e._id); }}
                                            style={{
                                                background: "#134e4a",
                                                color: "#fff",
                                                border: "none",
                                                padding: "5px 12px",
                                                borderRadius: 6,
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: 11,
                                                fontWeight: 600,
                                                letterSpacing: "0.2px",
                                                cursor: "pointer",
                                                flexShrink: 0,
                                            }}
                                        >
                                            See
                                        </button>
                                    </div>

                                    {/* Current task */}
                                    <div style={{
                                        fontFamily: "'DM Mono', monospace",
                                        fontSize: 9,
                                        fontWeight: 500,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.9px",
                                        color: "#9ca3af",
                                        marginBottom: 3,
                                    }}>
                                        Current Task
                                    </div>
                                    <div style={{
                                        fontFamily: "'DM Sans', sans-serif",
                                        fontSize: 12,
                                        fontWeight: 400,
                                        color: "#374151",
                                        lineHeight: 1.5,
                                        marginBottom: 8,
                                    }}>
                                        {e.task ?? "Task not added"}
                                    </div>

                                    {/* Dept chip */}
                                    <span style={{
                                        display: "inline-block",
                                        background: "#f3f4f6",
                                        borderRadius: 4,
                                        padding: "2px 8px",
                                        fontFamily: "'DM Mono', monospace",
                                        fontSize: 10,
                                        fontWeight: 400,
                                        color: "#6b7280",
                                        letterSpacing: "0.2px",
                                    }}>
                                        {e.department}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
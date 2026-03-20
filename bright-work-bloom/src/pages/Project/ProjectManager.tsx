import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { toast } from "../../hooks/use-toast";
import { Project, RawProject, RawEmployee, Employee, Department, RawDepartment } from '../../types/project.types'
const token = localStorage.getItem("token");
import { c } from '../../colors/color'
import { Av, EditModal, normaliseEmployee, normaliseProject, RingChart, SectionLabel } from "./Helperfunctions";

const inputSt: React.CSSProperties = {
    fontFamily: c.f, fontSize: 13, fontWeight: 400,
    padding: "8px 12px", border: `1px solid ${c.DIVIDER}`,
    borderRadius: 8, background: c.WHITE, color: c.TEXT2,
    outline: "none", width: "100%", boxSizing: "border-box" as const,
};


// ── Main component ───────────────────────────────────────────────────────────
export default function ProjectManage() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // form state
    const [newName, setNewName] = useState("");
    const [newPct, setNewPct] = useState<number | "">("");
    const [assignId, setAssignId] = useState<string | null>(null);
    const [selDept, setSelDept] = useState("");
    const [selEmpId, setSelEmpId] = useState("");

    // edit modal
    const [editProject, setEditProject] = useState<Project | null>(null);

    // ── Fetch all data on mount ────────────────────────────────────────────────
    useEffect(() => {
        async function loadAll() {
            setLoading(true);
            setError(null);
            try {
                const deptRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/departments`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }

                });
                if (deptRes.status === 402) {
                    navigate("/unauthorized", { replace: true });
                    return; // ← stop execution after redirect
                }
                if (!deptRes.ok) throw new Error(`Departments fetch failed: ${deptRes.status}`);
                const rawDepts: RawDepartment[] = await deptRes.json();

                const deptMap: Record<string, string> = {};
                rawDepts.forEach(d => {
                    deptMap[String(d.id).trim()] = d.name;
                });
                setDepartments(rawDepts.map(d => ({
                    id: String(d.id).trim(),
                    name: d.name
                })));

                const empRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employee`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                });
                if (empRes.status === 402) {
                    navigate("/unauthorized", { replace: true });
                    return; // ← stop execution after redirect
                }
                if (!empRes.ok) throw new Error(`Employee fetch failed: ${empRes.status}`);
                const rawEmps: RawEmployee[] = await empRes.json();
                // Deduplicate by employee ID, keeping the first occurrence
                const seenIds = new Set<string>();
                const uniqueEmps = rawEmps.filter(e => {
                    const id = String(e._id);
                    if (seenIds.has(id)) return false;
                    seenIds.add(id);
                    return true;
                });
                setEmployees(uniqueEmps.map(e => normaliseEmployee(e, deptMap)));

                const projRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/project`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
                if (projRes.status === 402) {
                    navigate("/unauthorized", { replace: true });
                    return; // ← stop execution after redirect
                }
                if (!projRes.ok) throw new Error(`Project fetch failed: ${projRes.status}`);
                const rawProjs: RawProject[] = await projRes.json();
                setProjects(rawProjs.map(normaliseProject));
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                setError(msg);
                toast({ title: "Error", description: msg, variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }
        loadAll();
    }, []);

    // ── Derived helpers ────────────────────────────────────────────────────────
    const deptEmployeesMap: Record<string, { id: string; name: string; role: string }[]> = {};

    // Build map using both department ID and name as keys for flexibility
    departments.forEach(dept => {
        const deptEmps = employees.filter(e =>
            e.department === dept.id || e.departmentName === dept.name
        );
        // Deduplicate by employee ID
        const seen = new Set<string>();
        deptEmployeesMap[dept.name] = deptEmps
            .filter(e => {
                if (seen.has(e.id)) return false;
                seen.add(e.id);
                return true;
            })
            .map(e => ({ id: e.id, name: e.name, role: e.role }));
    });

    function empById(id: string) {
        return employees.find(e => e.id === id);
    }

    const assignProject = projects.find(p => p.id === assignId) ?? null;
    const deptEmployees = selDept ? (deptEmployeesMap[selDept] ?? []) : [];

    const engagementMap: Record<string, number> = {};
    employees.forEach(e => {
        engagementMap[e.id] = projects.filter(p =>
            p.employeeid.includes(e.id) ||
            p.employeeid.some(pId => String(pId).trim() === e.id)
        ).length;
    });

    // ── Handlers ──────────────────────────────────────────────────────────────
    async function handleCreate() {
        if (!newName.trim()) return;
        const pct = typeof newPct === "number" ? Math.min(100, Math.max(0, newPct)) : 0;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/project`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name: newName.trim(), progress: pct }),
            });

            if (res.status === 402) {
                navigate("/unauthorized", { replace: true });
                return; // ← stop execution after redirect
            }
            if (!res.ok) throw new Error(`Create project failed: ${res.status}`);
            const raw: RawProject = await res.json();
            setProjects(prev => [...prev, normaliseProject(raw)]);
            toast({ title: "Success", description: "Project created successfully" });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
            toast({ title: "Error", description: msg, variant: "destructive" });
        }
        setNewName("");
        setNewPct("");
    }

    async function handleAddMember() {
        if (!assignId || !selEmpId) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/project/asingEmployee`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ projectId: assignId, employeeId: selEmpId }),
            });


            if (res.status === 402) {
                navigate("/unauthorized", { replace: true });
                return; // ← stop execution after redirect
            }
            if (!res.ok) throw new Error(`Assign employee failed: ${res.status}`);
            setProjects(prev =>
                prev.map(p =>
                    p.id === assignId && !p.employeeid.includes(selEmpId)
                        ? { ...p, employeeid: [...p.employeeid, selEmpId] }
                        : p
                )
            );
            toast({ title: "Success", description: "Employee assigned to project" });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
            toast({ title: "Error", description: msg, variant: "destructive" });
        }
        setSelEmpId("");
    }

    function handleRemoveMember(projId: string, empId: string) {
        setProjects(prev =>
            prev.map(p =>
                p.id === projId
                    ? { ...p, employeeid: p.employeeid.filter(id => id !== empId) }
                    : p
            )
        );
        toast({ title: "Success", description: "Employee removed from project" });
    }

    // ── PATCH: rename project ─────────────────────────────────────────────────
    async function handleEditSave(projectId: string, newName: string) {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/project`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ projectId, newName }),
            });
            if (res.status === 402) {
                navigate("/unauthorized", { replace: true });
                return; // ← stop execution after redirect
            }
            if (!res.ok) throw new Error(`Rename project failed: ${res.status}`);
            // Update local state
            setProjects(prev =>
                prev.map(p => p.id === projectId ? { ...p, name: newName } : p)
            );
            toast({ title: "Success", description: "Project renamed successfully" });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
            toast({ title: "Error", description: msg, variant: "destructive" });
        }
    }

    // ── DELETE: remove project ────────────────────────────────────────────────
    async function handleDelete(projectId: string) {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/project`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ projectId }),
            });
            if (res.status === 402) {
                navigate("/unauthorized", { replace: true });
                return; // ← stop execution after redirect
            }
            if (!res.ok) throw new Error(`Delete project failed: ${res.status}`);
            // Clear assign panel first if this project was selected
            if (assignId === projectId) {
                setAssignId(null);
                setSelDept("");
                setSelEmpId("");
            }
            // Remove from local state
            setProjects(prev => prev.filter(p => p.id !== projectId));
            toast({ title: "Success", description: "Project deleted successfully" });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
            toast({ title: "Error", description: msg, variant: "destructive" });
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <AppLayout title="Project Management">
            <div style={{ fontFamily: c.f, background: c.BG, minHeight: "100vh", padding: "28px 32px", boxSizing: "border-box" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <span style={{ fontFamily: c.mono, fontSize: 15, fontWeight: 600, color: c.TEXT3, letterSpacing: "0.12em" }}>
                        Project Management
                    </span>
                    <div style={{ flex: 1, height: 1, background: c.DIVIDER }} />
                </div>

                {/* Error banner */}
                {error && (
                    <div style={{
                        background: "#fff0f0", border: "1px solid #f5c6c6", borderRadius: 10,
                        padding: "12px 16px", marginBottom: 20,
                        fontFamily: c.mono, fontSize: 12, color: "#c0392b",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                        <span>⚠ {error}</span>
                        <button
                            onClick={() => setError(null)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#c0392b", fontSize: 16, fontFamily: c.mono }}
                        >×</button>
                    </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>

                    {/* ── LEFT COLUMN ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Create project */}
                        <div style={{ background: c.WHITE, border: `1px solid ${c.DIVIDER}`, borderRadius: 14, padding: "20px 22px" }}>
                            <SectionLabel>Create Project</SectionLabel>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <div>
                                    <div style={{ fontFamily: c.mono, fontSize: 11, color: c.TEXT3, marginBottom: 5, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                                        Project Name
                                    </div>
                                    <input
                                        style={inputSt}
                                        placeholder="e.g. Pearl City POS"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handleCreate()}
                                    />
                                </div>
                                <div>
                                    <div style={{ fontFamily: c.mono, fontSize: 11, color: c.TEXT3, marginBottom: 5, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                                        Progress (%)
                                    </div>
                                    <input
                                        style={inputSt}
                                        type="number" min={0} max={100}
                                        placeholder="0 – 100"
                                        value={newPct}
                                        onChange={e => setNewPct(e.target.value === "" ? "" : Number(e.target.value))}
                                    />
                                </div>
                                <button
                                    onClick={handleCreate}
                                    disabled={!newName.trim()}
                                    style={{
                                        marginTop: 4,
                                        background: newName.trim() ? c.ACCENT : c.DIVIDER,
                                        color: newName.trim() ? c.WHITE : c.TEXT3,
                                        border: "none", borderRadius: 8, padding: "10px 0",
                                        fontFamily: c.f, fontSize: 13, fontWeight: 600,
                                        cursor: newName.trim() ? "pointer" : "not-allowed",
                                        width: "100%", transition: "background 0.15s",
                                    }}
                                >
                                    + Create Project
                                </button>
                            </div>
                        </div>

                        {/* Assign members */}
                        <div style={{ background: c.WHITE, border: `1px solid ${c.DIVIDER}`, borderRadius: 14, padding: "20px 22px" }}>
                            <SectionLabel>Assign Members</SectionLabel>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <div>
                                    <div style={{ fontFamily: c.mono, fontSize: 11, color: c.TEXT3, marginBottom: 5, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                                        Project
                                    </div>
                                    <select
                                        style={{ ...inputSt, cursor: "pointer" }}
                                        value={assignId ?? ""}
                                        onChange={e => {
                                            setAssignId(e.target.value || null);
                                            setSelDept("");
                                            setSelEmpId("");
                                        }}
                                    >
                                        <option value="">Select project…</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <div style={{ fontFamily: c.mono, fontSize: 11, color: c.TEXT3, marginBottom: 5, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                                        Department
                                    </div>
                                    <select
                                        style={{ ...inputSt, cursor: assignId ? "pointer" : "not-allowed", opacity: assignId ? 1 : 0.6 }}
                                        value={selDept}
                                        onChange={async e => {
                                            const deptName = e.target.value;
                                            setSelDept(deptName);
                                            setSelEmpId("");
                                            if (deptName) {
                                                const dept = departments.find(d => d.name === deptName);
                                                if (dept) {
                                                    try {
                                                        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employee/${dept.id}`, {
                                                            headers: {
                                                                "Authorization": `Bearer ${token}`,
                                                                "Content-Type": "application/json"
                                                            },
                                                        });
                                                        if (res.status === 402) {
                                                            navigate("/unauthorized", { replace: true });
                                                            return;
                                                        }
                                                        if (!res.ok) throw new Error(`Employee fetch failed: ${res.status}`);
                                                        const rawEmps: RawEmployee[] = await res.json();

                                                        // Add department field to employees since API doesn't return it
                                                        const enrichedEmps = rawEmps.map(e => ({
                                                            ...e,
                                                            department: dept.id
                                                        }));

                                                        const deptMap: Record<string, string> = {};
                                                        departments.forEach(d => { deptMap[String(d.id).trim()] = d.name; });
                                                        const fetched = enrichedEmps.map(e => normaliseEmployee(e as RawEmployee, deptMap));

                                                        setEmployees(prev => {
                                                            const otherEmps = prev.filter(e => e.department !== dept.id);
                                                            // Deduplicate by ID
                                                            const seen = new Set<string>();
                                                            const unique = fetched.filter(e => {
                                                                if (seen.has(e.id)) return false;
                                                                seen.add(e.id);
                                                                return true;
                                                            });
                                                            return [...otherEmps, ...unique];
                                                        });
                                                    } catch (err: unknown) {
                                                        const msg = err instanceof Error ? err.message : String(err);
                                                        setError(msg);
                                                        toast({ title: "Error", description: msg, variant: "destructive" });
                                                    }
                                                }
                                            }
                                        }}
                                        disabled={!assignId}
                                    >
                                        <option value="">Select department…</option>
                                        {Object.keys(deptEmployeesMap).map(d => (
                                            <option key={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>

                                {selDept && (
                                    <div>
                                        <div style={{ fontFamily: c.mono, fontSize: 11, color: c.TEXT3, marginBottom: 5, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                                            Employee
                                            <span style={{ marginLeft: 8, fontWeight: 400, color: c.TEXT3 }}>
                                                ({deptEmployees.length} in dept)
                                            </span>
                                        </div>
                                        {deptEmployees.length === 0 ? (
                                            <div style={{ fontFamily: c.mono, fontSize: 11, color: c.TEXT3, padding: "8px 0" }}>
                                                No employees in this department
                                            </div>
                                        ) : (
                                            <select
                                                style={{ ...inputSt, cursor: "pointer" }}
                                                value={selEmpId}
                                                onChange={e => setSelEmpId(e.target.value)}
                                            >
                                                <option value="">Select employee…</option>
                                                {deptEmployees.map(e => {
                                                    const already = assignProject?.employeeid.includes(e.id) ?? false;
                                                    return (
                                                        <option key={e.id} value={e.id} disabled={already}>
                                                            {e.name} — {e.role}{already ? " ✓" : ""}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={handleAddMember}
                                    disabled={!assignId || !selEmpId}
                                    style={{
                                        marginTop: 2,
                                        background: (!assignId || !selEmpId) ? c.DIVIDER : c.ACCENT,
                                        color: (!assignId || !selEmpId) ? c.TEXT3 : c.WHITE,
                                        border: "none", borderRadius: 8, padding: "10px 0",
                                        fontFamily: c.f, fontSize: 13, fontWeight: 600,
                                        cursor: (!assignId || !selEmpId) ? "not-allowed" : "pointer",
                                        width: "100%", transition: "background 0.15s",
                                    }}
                                >
                                    Add to Project
                                </button>

                                {assignProject && assignProject.employeeid.length > 0 && (
                                    <div style={{ marginTop: 4 }}>
                                        <div style={{ fontFamily: c.mono, fontSize: 9, color: c.TEXT3, marginBottom: 8, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                                            Current Members ({assignProject.employeeid.length})
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                            {assignProject.employeeid.map(id => {
                                                const emp = empById(id);
                                                if (!emp) return null;
                                                return (
                                                    <div
                                                        key={id}
                                                        style={{
                                                            display: "flex", alignItems: "center", gap: 10,
                                                            background: c.ACCENT_LT, borderRadius: 8, padding: "8px 10px",
                                                        }}
                                                    >
                                                        <Av name={emp.name} />
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontFamily: c.f, fontSize: 12, fontWeight: 600, color: c.TEXT }}>{emp.name}</div>
                                                            <div style={{ fontFamily: c.f, fontSize: 11, color: c.TEXT3 }}>{emp.role}</div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveMember(assignProject.id, id)}
                                                            style={{
                                                                background: "none", border: "none", cursor: "pointer",
                                                                color: c.TEXT3, fontSize: 16, padding: 2, fontFamily: c.mono,
                                                                lineHeight: 1,
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN ── */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Project rings */}
                        <div style={{ background: c.WHITE, border: `1px solid ${c.DIVIDER}`, borderRadius: 14, padding: "20px 22px" }}>
                            <SectionLabel>Project Breakdown</SectionLabel>
                            {loading ? (
                                <div style={{ textAlign: "center", color: c.TEXT3, fontFamily: c.mono, fontSize: 12, padding: "32px 0" }}>
                                    Loading…
                                </div>
                            ) : projects.length === 0 ? (
                                <div style={{ textAlign: "center", color: c.TEXT3, fontFamily: c.mono, fontSize: 12, padding: "32px 0" }}>
                                    No projects yet
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "24px 16px" }}>
                                    {projects.map(p => (
                                        <RingChart
                                            key={p.id}
                                            label={p.name}
                                            pct={p.pct}
                                            project={p}
                                            onEdit={setEditProject}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Engagement table */}
                        <div style={{ background: c.WHITE, border: `1px solid ${c.DIVIDER}`, borderRadius: 14, padding: "20px 22px" }}>
                            <SectionLabel>Employee Project Engagement</SectionLabel>

                            <div style={{
                                display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 80px",
                                padding: "8px 14px", background: c.BG, borderRadius: 8,
                                fontFamily: c.mono, fontSize: 9, fontWeight: 500, color: c.TEXT3,
                                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4,
                            }}>
                                <span>Employee</span>
                                <span>Department</span>
                                <span>Role</span>
                                <span style={{ textAlign: "center" as const }}>Projects</span>
                            </div>

                            {loading ? (
                                <div style={{ textAlign: "center", color: c.TEXT3, fontFamily: c.mono, fontSize: 12, padding: "32px 0" }}>
                                    Loading employees…
                                </div>
                            ) : employees.length === 0 ? (
                                <div style={{ textAlign: "center", color: c.TEXT3, fontFamily: c.mono, fontSize: 12, padding: "32px 0" }}>
                                    No employees found
                                </div>
                            ) : (
                                (() => {
                                    // Deduplicate employees by ID, keeping first occurrence
                                    const seen = new Set<string>();
                                    const uniqueEmployees = employees.filter(e => {
                                        if (seen.has(e.id)) return false;
                                        seen.add(e.id);
                                        return true;
                                    });
                                    return uniqueEmployees
                                        .slice()
                                        .sort((a, b) => (engagementMap[b.id] ?? 0) - (engagementMap[a.id] ?? 0))
                                        .map((emp, i) => {
                                            const count = engagementMap[emp.id] ?? 0;
                                            return (
                                                <div
                                                    key={emp.id}
                                                    style={{
                                                        display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 80px",
                                                        padding: "11px 14px",
                                                        borderBottom: i < uniqueEmployees.length - 1 ? `1px solid ${c.DIVIDER}` : "none",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                        <Av name={emp.name} />
                                                        <span style={{ fontFamily: c.f, fontSize: 13, fontWeight: 600, color: c.TEXT }}>{emp.name}</span>
                                                    </div>
                                                    <span style={{ fontFamily: c.f, fontSize: 12, color: c.TEXT2 }}>{emp.departmentName}</span>
                                                    <span style={{ fontFamily: c.f, fontSize: 12, color: c.TEXT3 }}>{emp.role}</span>
                                                    <div style={{ display: "flex", justifyContent: "center" }}>
                                                        <span style={{
                                                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                                                            width: 28, height: 28, borderRadius: "50%",
                                                            background: count > 0 ? c.ACCENT_LT : c.BG,
                                                            color: count > 0 ? c.ACCENT : c.TEXT3,
                                                            fontFamily: c.mono, fontSize: 11, fontWeight: 700,
                                                            border: count > 0 ? `1.5px solid #a8d5c0` : `1px solid ${c.DIVIDER}`,
                                                        }}>
                                                            {count}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        });
                                })()
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit modal (rendered outside the grid so it overlays everything) */}
            {editProject && (
                <EditModal
                    project={editProject}
                    onClose={() => setEditProject(null)}
                    onSave={handleEditSave}
                />
            )}
        </AppLayout>
    );
}
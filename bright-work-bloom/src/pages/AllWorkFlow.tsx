import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "../hooks/use-toast";
import { EmptyState } from "@/components/Messagebox";
import { FolderOpen } from "lucide-react";

const token = localStorage.getItem("token");

(() => {
  if (document.getElementById("__wf_fonts")) return;
  const l = document.createElement("link");
  l.id = "__wf_fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
  document.head.appendChild(l);
})();

const f = "'DM Sans', sans-serif";
const mono = "'DM Mono', monospace";

const BG = "#f0f4f2";
const WHITE = "#ffffff";
const DIVIDER = "#e8eeed";
const TEXT = "#656464";
const TEXT2 = "#403d3d";
const TEXT3 = "#8a8a8a";
const AV_BG = "#d6ece3";
const AV_TEXT = "#3d8c6e";
const ACCENT = "#3d8c6e";
const ACCENT_LT = "#eaf5ef";

const RING_COLOR = "#3d8c6e";
const RING_TRACK = "#dff0e8";
const RING_R = 50;
const RING_STROKE = 8;
const RING_SIZE = (RING_R + RING_STROKE) * 2 + 3;

const BADGE: Record<string, { color: string; border: string }> = {
  active: { color: "#3d8c6e", border: "#a8d5c0" },
  "on-leave": { color: "#b07a10", border: "#f0cc7a" },
  inactive: { color: "#7a8a84", border: "#c8d3cf" },
};

interface EmployeeData {
  name: string;
  deparment: string;
  totalproject: number;
  totalwaorkingday: number;
  totalHours: number;
  status: string;
  weeklyHours: number[];
  present: number;
  absent: number;
  late: number;
  half_day: number;
  completeProject: number;
  projects: { label: string; pct: number }[];
}

interface LogTask { time: string; desc: string; }
interface LogEntry { date: string; entryTime: string; leaveTime: string; tasks: LogTask[]; }



// ── Single ring ───────────────────────────────────────────────────────────────
function RingChart({ label, pct }: { label: string; pct: number }) {
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const circumference = 2 * Math.PI * RING_R;
  const filled = (pct / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} style={{ overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={RING_R} fill="none" stroke={RING_TRACK} strokeWidth={RING_STROKE} />
        <circle
          cx={cx} cy={cy} r={RING_R}
          fill="none"
          stroke={RING_COLOR}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
        <text
          x={cx} y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={700}
          fontFamily={mono}
          fill={RING_COLOR}
          letterSpacing="-0.3"
        >
          {pct}%
        </text>
      </svg>
      <span style={{
        fontFamily: mono, fontSize: 11, fontWeight: 600,
        color: TEXT3, textTransform: "uppercase" as const, textAlign: "center" as const,
      }}>
        {label}
      </span>
    </div>
  );
}

// ── Rings grid ────────────────────────────────────────────────────────────────
function ProjectRings({ data }: { data: { label: string; pct: number }[] }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
      gap: "16px 20px",
      width: "100%",
    }}>
      {data.map((d, i) => <RingChart key={`${d.label}-${i}`} label={d.label} pct={d.pct} />)}
    </div>
  );
}

// ── Weekly chart ──────────────────────────────────────────────────────────────
const DAY_LABELS = ["M", "T", "W", "T", "F", "M", "T", "W", "T", "F", "M", "T", "W"];

function hourColor(h: number): string {
  if (h <= 0) return DIVIDER;
  if (h < 7) return "#ef4444";
  if (h <= 7.5) return "#eab308";
  if (h <= 8.2) return "#3d8c6e";
  return "#1f5c49";
}

function WeeklyChart({ hours }: { hours: number[] }) {
  const max = Math.max(...hours, 1);
  const W = 500, H = 110, pX = 10, pY = 14;
  const barW = 26;
  const gap = (W - pX * 2 - barW * hours.length) / (hours.length - 1);
  const pts = hours.map((h, i) => ({
    x: pX + i * (barW + gap) + barW / 2,
    y: H - pY - (h / max) * (H - pY * 2), h,
  }));
  const targetY = H - pY - (8 / max) * (H - pY * 2);
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} style={{ overflow: "visible" }}>
      <line x1={pX} x2={W - pX} y1={targetY} y2={targetY} stroke="#b5d4c8" strokeDasharray="5 3" strokeWidth={1} />
      {pts.map(({ x, y, h }, i) => (
        <rect key={i} x={x - barW / 2} y={y} width={barW} height={H - pY - y}
          fill={hourColor(h)} opacity={0.35} rx={3} />
      ))}
      <polyline points={pts.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke={ACCENT} strokeWidth={1.5} strokeLinejoin="round" />
      {pts.map(({ x, y, h }, i) => (
        <circle key={i} cx={x} cy={y} r={4} fill={WHITE} stroke={hourColor(h)} strokeWidth={1.5} />
      ))}
      {pts.map(({ x }, i) => (
        <text key={i} x={x} y={H + 16} textAnchor="middle" fontSize={10} fill={TEXT3} fontFamily={mono}>
          {DAY_LABELS[i]}
        </text>
      ))}
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, children }: {
  label: string; value?: string; sub?: string; children?: React.ReactNode;
}) {
  return (

    <div style={{
      flex: 1, minWidth: 0,
      background: WHITE, border: `1px solid ${DIVIDER}`,
      borderRadius: 12, padding: "16px 18px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 500, color: TEXT3, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {label}
      </div>
      {children || (
        <>
          <div style={{ fontFamily: mono, fontSize: 20, fontWeight: 600, color: TEXT, lineHeight: 1.2, letterSpacing: "-0.3px" }}>
            {value}
          </div>

          <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 400, color: TEXT3 }}>{sub}</div>
        </>
      )}
    </div>
  );
}

// ── Employee details ──────────────────────────────────────────────────────────
function EmployeeDetails({ emp }: { emp: EmployeeData }) {
  const totalWorkingHours = emp.totalwaorkingday * 8;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <StatCard label="NAME" value={emp.name} sub="employee" />
        <StatCard label="DEPARTMENT" value={emp.deparment} sub="division" />
        <StatCard label="TOTAL PROJECTS" value={String(emp.totalproject).padStart(2, "0")} sub="active" />
        <StatCard label="TOTAL Complete PROJECTS" value={String(emp.completeProject)} sub="completed" />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <StatCard label="TOTAL WORKING DAYS" value={String(emp.totalwaorkingday)} />
        <StatCard label="Late Days" value={String(emp.late)} />
        <StatCard label="Half Days" value={String(emp.half_day)} />
        <StatCard label="Absent Days" value={String(emp.absent)} />

        <StatCard label="WORKING HOURS" value={`${emp.totalHours.toFixed(1)}h`} />
        <StatCard label="AVG WORKING HOURS" value={` ${emp.totalwaorkingday == 0 ? emp.totalHours.toFixed(1) : (emp.totalHours / emp.totalwaorkingday).toFixed(1)}h`} />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {/* Weekly hours */}
        <div style={{ flex: 2, minWidth: 240, background: WHITE, border: `1px solid ${DIVIDER}`, borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 600, color: TEXT3, marginBottom: 14, letterSpacing: "0.08em" }}>
            Weekly Hours Log
          </div>
          <WeeklyChart hours={emp.weeklyHours} />
        </div>
        {/* Project rings */}
        <div style={{ flex: 1, minWidth: 200, background: WHITE, border: `1px solid ${DIVIDER}`, borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: TEXT3, marginBottom: 14, letterSpacing: "0.08em" }}>
            Project Breakdown
          </div>
          <ProjectRings data={emp.projects} />
        </div>
      </div>
    </div>
  );
}

// ── Log row ───────────────────────────────────────────────────────────────────
function LogRow({ log, isOpen, onToggle }: { log: LogEntry; isOpen: boolean; onToggle: () => void }) {
  return (
    <div style={{ background: WHITE, border: `1px solid ${DIVIDER}`, borderRadius: 14, overflow: "hidden" }}>
      <div
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center",
          padding: "18px 22px", gap: 16,
          cursor: "pointer",
          userSelect: "none" as const,
        }}
      >
        {/* Play arrow in rounded square */}
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "#f0f2f5",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          transition: "transform 0.2s ease",
          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
        }}>
          <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
            <path d="M1 1L10 6.5L1 12V1Z" fill="#6b7280" />
          </svg>
        </div>

        {/* Date + time info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: TEXT2, letterSpacing: "-0.1px" }}>
            {log.date}
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: TEXT3, marginTop: 3 }}>
            {log.entryTime} → {log.leaveTime} · {log.tasks.length} tasks
          </div>
        </div>

        {/* Entries pill */}
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700,
          color: ACCENT, background: ACCENT_LT,
          padding: "6px 16px", borderRadius: 99,
          flexShrink: 0,
        }}>
          {log.tasks.length} entries
        </div>
      </div>

      {/* Expanded tasks */}
      {isOpen && (
        <div style={{ borderTop: `1px solid ${DIVIDER}`, padding: "8px 22px 14px 74px" }}>
          {log.tasks.map((task, i) => (
            <div key={i} style={{
              display: "flex", gap: 18, padding: "7px 0",
              borderBottom: i < log.tasks.length - 1 ? `1px solid ${DIVIDER}` : "none",
            }}>
              <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 400, color: ACCENT, flexShrink: 0, width: 88 }}>
                {task.time}
              </span>
              <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 400, color: TEXT2, lineHeight: 1.5 }}>
                {task.desc}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// ── Loading skeleton ──────────────────────────────────────────────────────────
function LoadingSkeleton() {
  const skeletonStyle = {
    background: `linear-gradient(90deg, ${DIVIDER} 25%, #f5f9f7 50%, ${DIVIDER} 75%)`,
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
    borderRadius: 8,
  };
  return (
    <>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[1, 2].map(row => (
          <div key={row} style={{ display: "flex", gap: 10 }}>
            {[1, 2, 3].map(col => (
              <div key={col} style={{ flex: 1, height: 80, ...skeletonStyle }} />
            ))}
          </div>
        ))}
        <div style={{ height: 160, ...skeletonStyle }} />
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AllWorkFlow() {
  const navigate = useNavigate();
  const { _id } = useParams();
  const [empData, setEmpData] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!_id) return;

    const fetchEmployee = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teamtrack/employeestatics/${_id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        if (res.status === 402) {
          navigate("/unauthorized", { replace: true });
          return; // ← stop execution after redirect
        }
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        const data: EmployeeData = await res.json();
        setEmpData(data);
      } catch (err: any) {
        const msg = err.message || "Failed to load employee data";
        setError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    const fetchLogs = async () => {
      try {
        setLogsLoading(true);
        setLogsError(null);
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teamtrack/logdata/${_id}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        if (res.status === 402) {
          navigate("/unauthorized", { replace: true });
          return; // ← stop execution after redirect
        }
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        const data: LogEntry[] = await res.json();
        setLogs(data);
   
      } catch (err: any) {
        const msg = err.message || "Failed to load log data";
        setLogsError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
        setLogsLoading(false);
      }
    };

    fetchEmployee();
    fetchLogs();
  }, [_id]);

  const initials = empData?.name
    ? empData.name.split(" ").map((n: string) => n[0]).join("")
    : "??";

  return (
    <AppLayout title="All Work Flow">
      <div style={{ fontFamily: mono, background: BG, minHeight: "100vh", padding: "28px 32px", boxSizing: "border-box" }}>

        {/* Page title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 400, color: TEXT3, letterSpacing: "0.12em" }}>
            all work flow
          </span>
          <div style={{ flex: 1, height: 1, background: DIVIDER }} />
        </div>

        {/* Employee details */}
        <div style={{ background: WHITE, border: `1px solid ${DIVIDER}`, borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: AV_BG, color: AV_TEXT,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: mono, fontWeight: 700, fontSize: 10, letterSpacing: "0.04em", flexShrink: 0,
            }}>
              {initials}
            </div>
            <span style={{ fontFamily: mono, fontSize: 19, fontWeight: 600, color: TEXT2, letterSpacing: "-0.1px" }}>
              Employee details
            </span>
            <div style={{ flex: 1, height: 1, background: DIVIDER }} />
          </div>

          {loading && <LoadingSkeleton />}

          {error && (
            <div style={{
              padding: "16px 20px", borderRadius: 10,
              background: "#fff5f5", border: "1px solid #fecaca",
              fontFamily: mono, fontSize: 13, color: "#dc2626",
            }}>
              ⚠ {error}
            </div>
          )}

          {!loading && !error && empData && <EmployeeDetails emp={empData} />}
        </div>

        {/* Logs */}
        <div style={{ background: WHITE, border: `1px solid ${DIVIDER}`, borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 600, color: TEXT3, marginBottom: 12 }}>
            Daily logs
          </div>

          {logsLoading && <LoadingSkeleton />}

          {logsError && (
            <div style={{
              padding: "16px 20px", borderRadius: 10,
              background: "#fff5f5", border: "1px solid #fecaca",
              fontFamily: mono, fontSize: 13, color: "#dc2626",
            }}>
              ⚠ {logsError}
            </div>
          )}

          {!logsLoading && !logsError && logs.length === 0 && (
            <EmptyState
              icon={FolderOpen}
              title="No Logs Found"
              subtitle="This employee has no daily logs recorded."
              type="default"
            />
          )}

          {!logsLoading && !logsError && logs.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {logs.map((log, i) => (

                <LogRow key={log.date} log={log} isOpen={openIndex === i}
                  onToggle={() => { setOpenIndex(openIndex === i ? null : i) }} />
              ))}
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
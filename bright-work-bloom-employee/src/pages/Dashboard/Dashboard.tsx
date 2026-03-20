// src/pages/EmployeeDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  Clock, CalendarCheck, CalendarX, Coffee, Briefcase,
  CheckCircle2, TrendingUp, ChevronLeft, ChevronRight, RefreshCw
} from "lucide-react";
import { C } from "../../colors/color";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "../../hooks/use-toast";
import { DashboardData } from "@/types/project.types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const statusColors = {
  present: { bg: `${C.primary}22`, border: C.primary, dot: C.primary },
  absent: { bg: "#fee2e222", border: "#ef4444", dot: "#ef4444" },
  leave: { bg: "#fef3c722", border: "#f59e0b", dot: "#f59e0b" },
  late: { bg: "#ede9fe22", border: "#8b5cf6", dot: "#8b5cf6" },
};

// ─── Bar color logic ──────────────────────────────────────────────────────────
const getBarColor = (hours: number) => {
  if (hours === 0) return `${C.primary}33`;
  if (hours >= 7.667) return `${C.primary}88`;
  if (hours >= 7.0) return "#f59e0b99";
  return "#ef444499";
};

const CustomBar = (props: any) => {
  const { x, y, width, height } = props;
  if (height <= 0) return null;
  const color = getBarColor(props.value);
  const r = 6;
  return (
    <path
      d={`M${x},${y + r} Q${x},${y} ${x + r},${y} L${x + width - r},${y} Q${x + width},${y} ${x + width},${y + r} L${x + width},${y + height} L${x},${y + height} Z`}
      fill={color}
    />
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div style={{
      background: C.bg, border: `1px solid ${C.border}`,
      borderRadius: 16, padding: "20px 22px",
      display: "flex", alignItems: "center", gap: 16,
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        backgroundColor: `${color}18`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 12, color: C.sub, marginBottom: 2, fontWeight: 500, letterSpacing: "0.03em" }}>
          {label.toUpperCase()}
        </p>
        <p style={{ fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>{value}</p>
        <p style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{sub}</p>
      </div>
    </div>
  );
}

// ─── Attendance Calendar ──────────────────────────────────────────────────────
function AttendanceCalendar({
  calendarData,
}: {
  calendarData: { date: string; status: "present" | "absent" | "leave" | "late" }[];
}) {
  // Build lookup: "YYYY-MM-DD" → status
  const calendarMap: Record<string, "present" | "absent" | "leave" | "late"> = {};
  calendarData.forEach(({ date, status }) => { calendarMap[date] = status; });

  // Default to latest month that has data
  const latestDate = calendarData.length
    ? new Date(calendarData[calendarData.length - 1].date)
    : new Date();

  const [year, setYear] = useState(latestDate.getFullYear());
  const [month, setMonth] = useState(latestDate.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const cells: { day: number; curr: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, curr: false });
  for (let d = 1; d <= daysInMonth; d++)   cells.push({ day: d, curr: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDay + 1, curr: false });

  const getStatus = (d: number, curr: boolean) => {
    if (!curr) return undefined;
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return calendarMap[key];
  };

  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <p style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{MONTHS[month]} {year}</p>
        <div style={{ display: "flex", gap: 6 }}>
          {[prev, next].map((fn, i) => (
            <button key={i} onClick={fn} style={{
              width: 30, height: 30, borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.pageBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: C.sub,
            }}>
              {i === 0 ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 8 }}>
        {DAYS.map(d => (
          <div key={d} style={{
            textAlign: "center", fontSize: 10, fontWeight: 600,
            color: C.sub, letterSpacing: "0.06em", paddingBottom: 8,
          }}>{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {cells.map(({ day, curr }, idx) => {
          const status = getStatus(day, curr);
          const sc = status ? statusColors[status] : null;
          return (
            <div key={idx} style={{
              height: 36, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 8,
              backgroundColor: sc ? sc.bg : "transparent",
              border: sc ? `1.5px solid ${sc.border}` : "none",
              fontSize: 13, fontWeight: 500,
              color: curr ? C.text : C.sub,
              opacity: curr ? 1 : 0.35,
            }}>
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: C.sub, letterSpacing: "0.08em", marginBottom: 10 }}>
          LEGEND
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {(["present", "absent", "leave", "late"] as const).map(s => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: statusColors[s].dot }} />
              <span style={{ fontSize: 12, color: C.text, textTransform: "capitalize" }}>
                {s === "leave" ? "On Leave" : s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user: authUser } = useAuth();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fixed: dependency array prevents infinite re-render loop
  useEffect(() => {
    if (!authUser?.id || !token) return;
    fetchDashboard();
  }, [authUser?.id]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/dashboard/employee/${authUser!.id}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 401 || res.status === 402 || res.status === 403) {
        navigate("/unauthorized", { replace: true });
        return;
      }
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const json: DashboardData = await res.json();
      setData(json);
    
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return (
    <AppLayout title="Dashboard">
      <div style={{
        backgroundColor: C.pageBg, minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <RefreshCw size={28} color={C.primary} style={{ animation: "spin 1s linear infinite" }} />
          <p style={{ color: C.sub, fontSize: 14 }}>Loading dashboard...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </AppLayout>
  );

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !data) return (
    <AppLayout title="Dashboard">
      <div style={{
        backgroundColor: C.pageBg, minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#ef4444", marginBottom: 12 }}>{error ?? "No data found"}</p>
          <button onClick={fetchDashboard} style={{
            padding: "8px 20px", borderRadius: 8, border: "none",
            backgroundColor: C.primary, color: "#fff", cursor: "pointer", fontSize: 13,
          }}>Retry</button>
        </div>
      </div>
    </AppLayout>
  );

  const { employee, attendanceSummary, projectSummary, weeklyHours, attendanceCalendar } = data;

  const attendanceStats = [
    { label: "Working Days", value: String(attendanceSummary.workingDays), sub: "since joining", icon: CalendarCheck, color: C.primary },
    { label: "Absent Days", value: String(attendanceSummary.absentDays), sub: "since joining", icon: CalendarX, color: "#ef4444" },
    { label: "On Leave", value: String(attendanceSummary.onLeaveDays), sub: "since joining", icon: Coffee, color: "#f59e0b" },
    { label: "Avg Hours/Day", value: `${attendanceSummary.avgHoursPerDay}h`, sub: "since joining", icon: Clock, color: C.primary },
  ];

  const performanceStats = [
    { label: "Total Projects", value: String(projectSummary.totalProjects).padStart(2, "0"), sub: "assigned", icon: Briefcase, color: C.primary },
    { label: "Completed", value: String(projectSummary.completedProjects).padStart(2, "0"), sub: "done", icon: CheckCircle2, color: "#10b981" },
    { label: "Working Hours", value: `${projectSummary.totalWorkingHours}h`, sub: "total", icon: Clock, color: C.primary },
    { label: "Attendance Rate", value: `${attendanceSummary.attendanceRate}%`, sub: "all time", icon: TrendingUp, color: "#10b981" },
  ];

  return (
    <AppLayout title="Dashboard">
      <div style={{ backgroundColor: C.pageBg, minHeight: "100vh", padding: "28px 32px", fontFamily: "inherit" }}>

        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
            Welcome back, {employee.name.split(" ")[0]} 👋
          </p>
        </div>

        {/* Employee profile strip */}
        <div style={{
          background: C.bg, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: "18px 24px",
          display: "flex", alignItems: "center", gap: 16, marginBottom: 24,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            backgroundColor: employee.avatarColor,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 15, color: C.primary, flexShrink: 0,
          }}>
            {employee.avatar}
            {/* change */}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{employee.name}</p>
            <p style={{ fontSize: 12, color: C.sub }}>{employee.role} · {employee.department}</p>
          </div>
          <span style={{
            marginLeft: "auto", fontSize: 11, fontWeight: 600,
            padding: "4px 10px", borderRadius: 20,
            backgroundColor: employee.status === "active" ? `${C.primary}18` : "#fef3c7",
            color: employee.status === "active" ? C.primary : "#f59e0b",
            textTransform: "capitalize",
          }}>
            {employee.status}
          </span>
        </div>

        {/* Attendance stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {attendanceStats.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Performance stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {performanceStats.map(s => <StatCard key={s.label} {...s} />)}
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>

          {/* Hours Log */}
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4, fontFamily: "monospace" }}>
              Last 10 Logs
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: C.sub }}>All time · daily breakdown</p>
              <div style={{ display: "flex", gap: 14 }}>
                {[
                  { label: "≥ 7h 40m", color: `${C.primary}88` },
                  { label: "7h – 7h 39m", color: "#f59e0b99" },
                  { label: "< 7h", color: "#ef444499" },
                ].map(({ label, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
                    <span style={{ fontSize: 11, color: C.sub }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyHours} barSize={32} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: C.sub }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v}h`, "Hours"]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
                />
                <ReferenceLine y={7.667} stroke="#f59e0b" strokeDasharray="4 3" strokeOpacity={0.6} />
                <ReferenceLine y={7.0} stroke="#ef4444" strokeDasharray="4 3" strokeOpacity={0.6} />
                <Bar dataKey="hours" shape={(props: any) => <CustomBar {...props} />} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Attendance Calendar */}
          <AttendanceCalendar calendarData={attendanceCalendar} />

        </div>
      </div>
    </AppLayout>
  );
}
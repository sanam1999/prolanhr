import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2, XCircle, Clock, Loader2,
  CalendarDays, Users, TrendingUp,
  ChevronLeft, ChevronRight, Trash2, Plus, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "../hooks/use-toast";

const token = localStorage.getItem("token");

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmployeeId {
  _id: string;
  fullName: string;
  email: string;
  department: string;
  status: string;
  avatar: string;
}

interface LeaveRequestAPI {
  _id: string;
  employeeId: EmployeeId;
  type: "vacation" | "sick" | "personal" | "maternity";
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
  reason: string;
  createdAt: string;
  updatedAt: string;
}

interface Holiday {
  _id?: string;
  date: string;
  name: string;
  type: "national" | "religious" | "optional" | "other";
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const TYPE_ICON: Record<string, string> = {
  national: "🏛", religious: "🕌", optional: "🌿", other: "📌",
};
const TYPE_COLOR: Record<string, string> = {
  national: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  religious: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  optional: "bg-green-500/15 text-green-400 border-green-500/20",
  other: "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

const DEFAULT_HOLIDAYS: Holiday[] = [
  { date: `${new Date().getFullYear()}-01-01`, name: "New Year's Day", type: "national" },
  { date: `${new Date().getFullYear()}-05-01`, name: "Labour Day", type: "national" },
  { date: `${new Date().getFullYear()}-08-15`, name: "Independence Day", type: "national" },
  { date: `${new Date().getFullYear()}-12-25`, name: "Christmas Day", type: "religious" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}
function isWeekend(y: number, m: number, d: number) {
  const w = new Date(y, m, d).getDay();
  return w === 0 || w === 6;
}

// ─── Add Holiday Modal ────────────────────────────────────────────────────────
function AddHolidayModal({
  holidays,
  onAdd,
  onClose,
}: {
  holidays: Holiday[];
  onAdd: (h: Holiday) => void;
  onClose: () => void;
}) {
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<Holiday["type"]>("national");
  const [err, setErr] = useState("");

  function handleAdd() {
    if (!date) { setErr("Please pick a date"); return; }
    if (!name.trim()) { setErr("Please enter a holiday name"); return; }
    if (holidays.some(h => h.date === date)) { setErr("A holiday already exists on this date"); return; }
    onAdd({ date, name: name.trim(), type });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-background border border-border rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-purple-400" />
            <h3 className="font-semibold text-base">Add Holiday</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Date</label>
            <Input
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); setErr(""); }}
              className="h-10 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Holiday Name</label>
            <Input
              placeholder="e.g. Eid al-Fitr"
              value={name}
              onChange={e => { setName(e.target.value); setErr(""); }}
              className="h-10 text-sm"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as Holiday["type"])}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring text-foreground"
            >
              <option value="national">National</option>
              <option value="religious">Religious</option>
              <option value="optional">Optional</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {err && <p className="text-xs text-destructive">{err}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1 h-10" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 h-10 gap-1.5" onClick={handleAdd}>
            <Plus className="h-4 w-4" /> Add Holiday
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Holiday Calendar (right panel) ──────────────────────────────────────────
function HolidayCalendar({
  holidays,
  onRemove,
  onOpenAdd,
}: {
  holidays: Holiday[];
  onRemove: (date: string) => void;
  onOpenAdd: () => void;
}) {
  const today = new Date();
  const [cy, setCy] = useState(today.getFullYear());
  const [cm, setCm] = useState(today.getMonth());

  const holidaySet = new Set(holidays.map(h => h.date));
  const holidayMap = Object.fromEntries(holidays.map(h => [h.date, h]));

  function shiftMonth(dir: number) {
    let nm = cm + dir, ny = cy;
    if (nm > 11) { nm = 0; ny++; }
    if (nm < 0) { nm = 11; ny--; }
    setCm(nm); setCy(ny);
  }

  const firstDay = new Date(cy, cm, 1).getDay();
  const daysInMonth = new Date(cy, cm + 1, 0).getDate();

  // Holidays in current month view
  const monthStr = `${cy}-${String(cm + 1).padStart(2, "0")}`;
  const monthHolidays = holidays.filter(h => h.date.startsWith(monthStr)).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Calendar card */}
      <Card className="shadow-sm">
        <CardContent className="p-5">
          {/* Month nav + Add Holiday button */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold tracking-tight">{MONTHS[cm]} {cy}</h2>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-purple-400 border-purple-500/30 hover:bg-purple-500/10" onClick={onOpenAdd}>
                <Plus className="h-3.5 w-3.5" /> Add Holiday
              </Button>
              <Button size="icon" variant="secondary" className="rounded-xl h-8 w-8" onClick={() => shiftMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="secondary" className="rounded-xl h-8 w-8" onClick={() => shiftMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Day name row */}
          <div className="grid grid-cols-7 mb-1.5">
            {DAY_NAMES.map((n, i) => (
              <div
                key={n}
                className={`text-center text-[10px] font-semibold tracking-widest uppercase pb-2.5
                  ${i === 0 || i === 6 ? "text-red-400/70" : "text-muted-foreground"}`}
              >
                {n}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-[4px]">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const key = fmtKey(cy, cm, d);
              const we = isWeekend(cy, cm, d);
              const hol = holidaySet.has(key);
              const holD = holidayMap[key];
              const isTdy = cy === today.getFullYear() && cm === today.getMonth() && d === today.getDate();

              return (
                <div
                  key={d}
                  title={hol ? holD?.name : undefined}
                  className={[
                    "aspect-square rounded-lg flex flex-col items-center justify-center",
                    "text-xs font-medium select-none transition-all",
                    isTdy ? "ring-2 ring-blue-500" : "",
                    hol ? "bg-purple-500/15 border border-purple-500/40 text-purple-300" : "",
                    we && !hol ? "text-muted-foreground/35" : "",
                    !we && !hol ? "bg-secondary/60 border border-border/40 text-foreground" : "",
                  ].join(" ")}
                >
                  <span className="leading-none">{d}</span>
                  {hol && (
                    <span className="text-[7px] leading-tight text-purple-400/80 text-center px-0.5 truncate max-w-full mt-0.5 hidden sm:block">
                      {holD?.name.split(" ")[0]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-border/50 flex-wrap">
            {[
              { color: "bg-secondary border border-border/40", label: "Weekday" },
              { color: "bg-red-500/20", label: "Weekend" },
              { color: "bg-purple-500/60", label: "Holiday" },
              { color: "ring-2 ring-blue-500 bg-transparent", label: "Today" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <div className={`w-2.5 h-2.5 rounded-[3px] ${l.color}`} />
                {l.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Holidays list for this month */}
      <Card className="shadow-sm flex-1 overflow-hidden">
        <CardContent className="p-5 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Holidays — {MONTHS[cm]}
            </h3>
            <Badge variant="outline" className="text-purple-400 border-purple-500/30 bg-purple-500/10 text-xs">
              {monthHolidays.length} {monthHolidays.length === 1 ? "holiday" : "holidays"}
            </Badge>
          </div>

          {monthHolidays.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 gap-2">
              <CalendarDays className="h-7 w-7" />
              <p className="text-xs">No holidays this month</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1">
              {monthHolidays.map(h => {
                const [y, mo, d] = h.date.split("-");
                const dateLabel = `${String(d).padStart(2, "0")} ${MONTHS[parseInt(mo) - 1]} ${y}`;
                return (
                  <div
                    key={h.date}
                    className="flex items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-2.5 group hover:border-purple-500/40 transition-colors"
                  >
                    <span className="text-lg leading-none">{TYPE_ICON[h.type] ?? "📌"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{h.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-purple-400">{dateLabel}</span>
                        <Badge variant="outline" className={`text-[10px] h-4 px-1.5 capitalize ${TYPE_COLOR[h.type]}`}>
                          {h.type}
                        </Badge>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemove(h.date)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Leave Requests Panel (left) ──────────────────────────────────────────────
function LeaveRequestsPanel({
  requests,
  loading,
  error,
  onAction,
}: {
  requests: LeaveRequestAPI[];
  loading: boolean;
  error: string | null;
  onAction: (id: string, action: "approved" | "rejected") => void;
}) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const filtered = requests.filter(r => filter === "all" || r.status === filter);

  // Mini stats
  const pending = requests.filter(r => r.status === "pending").length;
  const approved = requests.filter(r => r.status === "approved").length;
  const rejected = requests.filter(r => r.status === "rejected").length;
  const uniqueEmployees = new Set(requests.map(r => r.employeeId._id)).size;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Stats row */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Pending", value: pending, icon: <Clock className="h-3.5 w-3.5" />, color: "text-warning", bg: "bg-warning/10" },
            { label: "Approved", value: approved, icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-success", bg: "bg-success/10" },
            { label: "Rejected", value: rejected, icon: <XCircle className="h-3.5 w-3.5" />, color: "text-destructive", bg: "bg-destructive/10" },
            { label: "Employees", value: uniqueEmployees, icon: <Users className="h-3.5 w-3.5" />, color: "text-blue-400", bg: "bg-blue-500/10" },
          ].map(s => (
            <Card key={s.label} className="shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.bg} ${s.color}`}>
                  {s.icon}
                </div>
                <div>
                  <p className={`text-lg font-bold leading-none ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize h-8 text-xs"
          >
            {f}
            {f !== "all" && (
              <span className="ml-1 opacity-70">({requests.filter(r => r.status === f).length})</span>
            )}
          </Button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
        {loading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        )}
        {error && !loading && (
          <div className="py-8 text-center text-destructive text-sm">⚠️ {error}</div>
        )}

        {!loading && !error && filtered.map(leave => (
          <Card key={leave._id} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 h-9 w-9 rounded-full overflow-hidden bg-primary/10">
                  <img src={leave.employeeId.avatar} alt="avatar" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate">{leave.employeeId.fullName}</p>
                    <Badge
                      variant="outline"
                      className={
                        leave.status === "approved"
                          ? "bg-success/10 text-success border-success/20 text-[10px] shrink-0"
                          : leave.status === "pending"
                            ? "bg-warning/10 text-warning border-warning/20 text-[10px] shrink-0"
                            : "bg-destructive/10 text-destructive border-destructive/20 text-[10px] shrink-0"
                      }
                    >
                      {leave.status === "approved" && <CheckCircle2 className="h-2.5 w-2.5 mr-1" />}
                      {leave.status === "pending" && <Clock className="h-2.5 w-2.5 mr-1" />}
                      {leave.status === "rejected" && <XCircle className="h-2.5 w-2.5 mr-1" />}
                      {leave.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="capitalize text-[10px] h-4 px-1.5">{leave.type}</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                    </span>
                  </div>

                  {leave.reason && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{leave.reason}</p>
                  )}

                  {leave.status === "pending" && (
                    <div className="flex gap-1.5 mt-2.5">
                      <Button size="sm" variant="outline"
                        className="h-7 text-xs text-success hover:bg-success/10 flex-1"
                        onClick={() => onAction(leave._id, "approved")}>
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline"
                        className="h-7 text-xs text-destructive hover:bg-destructive/10 flex-1"
                        onClick={() => onAction(leave._id, "rejected")}>
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No leave requests found.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Leaves() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<LeaveRequestAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddHoliday, setShowAddHoliday] = useState(false);

  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    async function fetchHolidays() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/holiday?year=${new Date().getFullYear()}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        if (res.status === 402) {
          navigate("/unauthorized", { replace: true });
          return; // ← stop execution after redirect
        }
        if (!res.ok) throw new Error("Failed to fetch holidays");
        const data: Holiday[] = await res.json();
        setHolidays(data);
      } catch {
        setHolidays(DEFAULT_HOLIDAYS); // fallback if backend unavailable
        toast({ title: "Info", description: "Using default holidays" });
      }
    }
    fetchHolidays();
  }, []);

  const handleAddHoliday = async (h: Holiday) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/holiday`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(h),
      });
      if (res.status === 402) {
        navigate("/unauthorized", { replace: true });
        return; // ← stop execution after redirect
      }

      if (!res.ok) throw new Error("Failed to add holiday");
      const saved: Holiday = await res.json();
      setHolidays(prev => [...prev, saved]);
      toast({ title: "Success", description: "Holiday added successfully" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to add holiday", variant: "destructive" });
    }
  };

  const handleRemoveHoliday = async (date: string) => {
    const holiday = holidays.find(h => h.date === date) as Holiday & { _id?: string };
    if (!holiday?._id) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/holiday/${holiday._id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      if (res.status === 402) {
        navigate("/unauthorized", { replace: true });
        return; // ← stop execution after redirect
      }
      if (!res.ok) throw new Error("Failed to delete holiday");
      setHolidays(prev => prev.filter(h => h.date !== date));
      toast({ title: "Success", description: "Holiday removed successfully" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to remove holiday", variant: "destructive" });
    }
  };

  useEffect(() => {
    async function fetchLeaves() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leaveRequest`, {
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
        const data: LeaveRequestAPI[] = await res.json();
        setRequests(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to fetch leave requests";
        setError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    fetchLeaves();
  }, []);

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    setRequests(prev => prev.map(r => r._id === id ? { ...r, status: action } : r));
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leaveRequest`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: action, _id: id }),
      });

      if (res.status === 402) {
        navigate("/unauthorized", { replace: true });
        return; // ← stop execution after redirect
      }
      if (!res.ok) throw new Error("Failed to update");
      toast({ title: "Success", description: `Leave request ${action}` });
    } catch {
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: "pending" } : r));
      toast({ title: "Error", description: "Failed to update leave request", variant: "destructive" });
    }
  };

  return (
    <AppLayout title="Leave Management">
      {/* Full-height split layout */}
      <div className="grid gap-5 h-[calc(100vh-120px)]" style={{ gridTemplateColumns: "7fr 3fr" }}>
        {/* ── Left: Leave Requests ── */}
        <LeaveRequestsPanel
          requests={requests}
          loading={loading}
          error={error}
          onAction={handleAction}
        />

        {/* ── Right: Calendar + Holidays ── */}
        <HolidayCalendar
          holidays={holidays}
          onRemove={handleRemoveHoliday}
          onOpenAdd={() => setShowAddHoliday(true)}
        />
      </div>

      {/* Add Holiday Modal */}
      {showAddHoliday && (
        <AddHolidayModal
          holidays={holidays}
          onAdd={handleAddHoliday}
          onClose={() => setShowAddHoliday(false)}
        />
      )}
    </AppLayout>
  );
}
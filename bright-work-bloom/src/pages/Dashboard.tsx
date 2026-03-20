import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Building2, TrendingUp, Clock, UserCheck, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "../hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ── Types ────────────────────────────────────────────────────────
interface Department {
  id: string;
  name: string;
  employeeCount: number;
}

interface Attendance {
  rate: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  thisMonthCount: number;
  lastMonthCount: number;
}

interface RoleCount {
  _id: string;
  rolecount: number;
}

interface EmployeeStatus {
  name: string;
  value: number;
}

interface DashboardData {
  employeeCount: number;
  departmentCount: number;
  departments: Department[];
  attendance: Attendance;
  pendingLeaveRequests: number;
  roleCounts: RoleCount[];
  employeeStatus: EmployeeStatus[];
}

// ── Constants ────────────────────────────────────────────────────
const PIE_COLORS = ["hsl(174, 62%, 32%)", "hsl(36, 90%, 55%)", "hsl(0, 100%, 50%)"];

// ── Component ────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token"); // adjust to your auth storage key
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/dashboard/admin`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.status === 402) {
          navigate("/unauthorized", { replace: true });
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch dashboard data (${res.status})`);
        }

        const json: DashboardData = await res.json();
        setData(json);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  // ── Loading state ──
  if (loading) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          Loading dashboard…
        </div>
      </AppLayout>
    );
  }

  // ── Error state ──
  if (error || !data) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex items-center justify-center h-64 text-destructive text-sm">
          {error ?? "No data available."}
        </div>
      </AppLayout>
    );
  }

  // ── Derived / mapped data ─────────────────────────────────────────
  const departmentData = data.departments.map(d => ({
    name: d.name.length > 10 ? d.name.slice(0, 10) + "…" : d.name,
    employees: d.employeeCount,
  }));

  const roleDistribution = data.roleCounts.map(r => ({
    role: r._id,
    count: r.rolecount,
  }));

  const totalRoles = roleDistribution.reduce((sum, r) => sum + r.count, 0) || 1;

  // ── Render ────────────────────────────────────────────────────────
  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Employees"
            value={data.employeeCount}
            icon={Users}
          />
          <StatCard
            title="Pending Approvals"
            value={data.pendingLeaveRequests}
            changeType="neutral"
            icon={Clock}
            iconClassName="bg-warning/10 text-warning"
          />
          <StatCard
            title="Departments"
            value={data.departmentCount}
            icon={Building2}
            iconClassName="bg-info/10 text-info"
          />
          <StatCard
            title="Attendance Rate"
            value={data.attendance.rate}
            change={data.attendance.change}
            changeType={data.attendance.changeType}
            icon={TrendingUp}
            iconClassName="bg-success/10 text-success"
          />
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Employees by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 16%, 89%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(210, 12%, 50%)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(210, 12%, 50%)" />
                    <Tooltip />
                    <Bar dataKey="employees" fill="hsl(174, 62%, 32%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Employee Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.employeeStatus}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={80}
                      paddingAngle={4} dataKey="value"
                    >
                      {data.employeeStatus.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {data.employeeStatus.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {entry.name} ({entry.value})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Admin Panels ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Departments list */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.departments.map(dept => (
                  <div key={dept.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                      {dept.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{dept.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {dept.employeeCount} {dept.employeeCount === 1 ? "employee" : "employees"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Distribution */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Role Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roleDistribution.map(({ role, count }) => (
                  <div key={role} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-36 flex-shrink-0 truncate">{role}</span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(count / totalRoles) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-4 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
}
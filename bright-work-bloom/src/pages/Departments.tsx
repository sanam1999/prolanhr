import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, User, ChevronLeft, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "../hooks/use-toast";
import { EmptyState } from "@/components/Messagebox";
import { FolderOpen } from "lucide-react";

const token = localStorage.getItem("token");

export interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "on-leave" | "inactive";
  joinDate: string;
  avatar: string;
  phone: string;
  salary: number;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  employeeCount: number;
  budget: number;
}

const PRIMARY = "#1F8278";

export default function Departments() {
  const navigate = useNavigate();
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptEmployees, setDeptEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [empLoading, setEmpLoading] = useState(false);

  async function getDepartments() {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/departments`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.status === 402) {
        navigate("/unauthorized", { replace: true });
        return; // ← stop execution after redirect
      }
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data: Department[] = await res.json();
      setDepartments(data);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load departments", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function getEmployees(id: string) {
    setEmpLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employee/${id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.status === 402) {
        navigate("/unauthorized", { replace: true });
        return;
      }
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data: Employee[] = await res.json();
      setDeptEmployees(data);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load employees", variant: "destructive" });
    } finally {
      setEmpLoading(false);
    }
  }

  useEffect(() => {
    getDepartments();
  }, []);

  function handleDeptClick(dept: Department) {
    setSelectedDept(dept);
    getEmployees(dept.id);
  }

  function handleBack() {
    setSelectedDept(null);
    setDeptEmployees([]);
  }

  // ─── DEPARTMENT DETAIL PAGE ───────────────────────────────────────────────
  if (selectedDept) {
    return (
      <AppLayout title="Departments">
        <div className="space-y-5">
          {/* Back + Header */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
              onClick={() => setSelectedDept(null)}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Dept Info Banner */}
          <div
            className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ backgroundColor: `${PRIMARY}12` }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0"
              style={{ backgroundColor: `${PRIMARY}20`, color: PRIMARY }}
            >
              <Users className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-0.5">{selectedDept.name}</h2>
              <p className="text-sm text-muted-foreground">Head: <span className="font-medium text-foreground">{selectedDept.head}</span></p>
            </div>
            <div className="flex gap-4 sm:gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: PRIMARY }}>{selectedDept.employeeCount}</p>
                <p className="text-xs text-muted-foreground">Employees</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: PRIMARY }}>${(selectedDept.budget / 1000).toFixed(0)}k</p>
                <p className="text-xs text-muted-foreground">Budget</p>
              </div>
            </div>
          </div>

          {/* Employee List */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Team Members ({deptEmployees.length})
            </p>

            {empLoading ? (
              <div className="py-16 text-center text-muted-foreground text-sm rounded-2xl border border-dashed">
                Loading employees...
              </div>
            ) : deptEmployees.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No Employees Found"
                subtitle="There are no employees in this department."
                type="default"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {deptEmployees.map((emp) => (
                  <div
                    key={emp._id}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border/60 hover:border-border hover:shadow-sm bg-background cursor-pointer transition-all">
                    <div className="shrink-0 h-10 w-10 rounded-full overflow-hidden bg-primary/10">
                      <img src={emp.avatar} alt="avatar" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{emp.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{emp.role}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        emp.status === "active"
                          ? "bg-success/10 text-success border-success/20 text-xs"
                          : emp.status === "on-leave"
                            ? "bg-warning/10 text-warning border-warning/20 text-xs"
                            : "bg-muted text-muted-foreground text-xs"
                      }
                    >
                      {emp.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


      </AppLayout>
    );
  }

  // ─── DEPARTMENTS GRID ─────────────────────────────────────────────────────
  return (
    <AppLayout title="Departments">
      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          Loading departments...
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No Departments Found"
          subtitle="There are no departments to display."
          type="default"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, i) => (
            <Card
              key={dept.id}
              className="shadow-sm hover:shadow-md transition-shadow cursor-pointer animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
              onClick={() => handleDeptClick(dept)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${PRIMARY}18`, color: PRIMARY }}
                  >
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="font-semibold text-base mb-3">{dept.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>Head: <span className="text-foreground font-medium">{dept.head}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{dept.employeeCount} employees</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Budget: ${dept.budget.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
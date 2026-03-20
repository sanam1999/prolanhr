import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { DollarSign, TrendingUp, Users, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "../hooks/use-toast";
import { EmptyState } from "@/components/Messagebox";
import { FolderOpen } from "lucide-react";
import { handleDownloadPDF } from "../lib/DownloadPDF"; // ← adjust path as needed

interface Employee {
  _id: string;
  fullName: string;
  avatar: string;
  department: {
    name: string;
  };
  salary: number;
  status: string;
}

export default function Payroll() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployees = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employee/employees`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.status === 402) {
          navigate("/unauthorized", { replace: true });
          return;
        }

        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        setEmployees(data);
 
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to load payroll data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [navigate]);

  const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0);
  const avgSalary = employees.length ? Math.round(totalPayroll / employees.length) : 0;
  const activeEmployees = employees.filter(e => e.status === "active");

  return (
    <AppLayout title="Payroll">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => {
              handleDownloadPDF(totalPayroll, avgSalary, activeEmployees);
            }}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Total Payroll" value={`$${totalPayroll.toLocaleString()}`} icon={DollarSign} />
          <StatCard title="Average Salary" value={`$${avgSalary.toLocaleString()}`} icon={TrendingUp} iconClassName="bg-info/10 text-info" />
          <StatCard title="Active Employees" value={activeEmployees.length} icon={Users} iconClassName="bg-success/10 text-success" />
        </div>
        <Card className="shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Loading payroll data...
              </div>
            ) : activeEmployees.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={FolderOpen}
                  title="No Active Employees"
                  subtitle="There are no active employees to display in payroll."
                  type="default"
                />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-semibold text-muted-foreground p-3 pl-4">Employee</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground p-3">Department</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground p-3 pr-4">Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {activeEmployees.map(emp => (
                    <tr key={emp._id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatar}
                            alt={emp.fullName}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <span className="text-sm font-medium">{emp.fullName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{emp.department.name}</td>
                      <td className="p-3 pr-4 text-sm font-semibold text-right">${emp.salary.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
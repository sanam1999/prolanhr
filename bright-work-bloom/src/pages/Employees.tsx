import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Search, Plus, Mail, Phone, Trash, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "../hooks/use-toast";
import { EmptyState } from "@/components/Messagebox";
import { FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

const token = localStorage.getItem("token");

const DEPARTMENT_NAMES = [
  "Software Engineering Department",
  "AI & Research Department",
  "Cybersecurity Department",
  "Project Management Office (PMO)",
  "Sales & Business Development",
  "Administration & Finance",
];

const EMPTY_FORM = {
  name: "",
  role: "",
  department: "",
  joinDate: "",
  salary: "",
  email: "",
  phone: "",
};

interface Attendance {
  _id: string;
  fullName: string;
  email: string;
  avatar: string;
  phone: string;
  department: string;
  role: string;
  status?: string;
  joinDate: string;
  salary?: number;
  checkIn: string | null;
  checkOut: string | null;
}

export default function Employees() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Attendance | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [employeeList, setEmployeeList] = useState<Attendance[]>([]);
  const [employeeToDelete, setEmployeeToDelete] = useState<Attendance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function getuserdata() {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employee`, {
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
      const data: Attendance[] = await res.json();
      setEmployeeList(data);
    } catch (error) {
      console.log(error);
      toast({ title: "Error", description: "Failed to load employees", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    getuserdata();
  }, []);

  const filteredList = employeeList.filter((emp) => {
    const q = search.toLowerCase();
    return (
      emp.fullName?.toLowerCase().includes(q) ||
      emp.role?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.phone?.toLowerCase().includes(q) ||
      emp.status?.toLowerCase().includes(q)
    );
  });

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddEmployee = async () => {
    if (!form.name || !form.role || !form.department || !form.email || !form.joinDate) {
      toast({ title: "Error", description: "Please fill in all required fields!", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employee`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form),
      });
      if (res.status === 402) {
        navigate("/unauthorized", { replace: true });
        return;
      }
      if (!res.ok) throw new Error("Failed to update");
      setForm(EMPTY_FORM);
      setShowAddDialog(false);
      toast({ title: "Success", description: "Employee added successfully" });
      getuserdata();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  async function confirmDeleteUser() {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/employee/${employeeToDelete._id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      if (res.status === 402) {
        navigate("/unauthorized", { replace: true });
        return;
      }
      if (!res.ok) throw new Error(`Failed to delete: ${res.status}`);
      toast({ title: "Success", description: `${employeeToDelete.fullName} has been removed.` });
      setEmployeeToDelete(null);
      getuserdata();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AppLayout title="Employees">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="gap-2 self-start" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>

        <Card className="shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Loading employees...
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={FolderOpen}
                  title="No Employees Found"
                  subtitle="No employees match your search or no employees have been added yet."
                  type="default"
                />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-semibold text-muted-foreground p-3 pl-4">Employee</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden md:table-cell">Role</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden lg:table-cell">Phone NO</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground p-3">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden lg:table-cell">check In</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden lg:table-cell">check Out</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground p-3 hidden lg:table-cell">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((emp) => (
                    <tr
                      key={emp._id}
                      className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-3">

                          <div className="shrink-0 h-10 w-10 rounded-full overflow-hidden bg-primary/10">
                            <img src={emp.avatar} alt="avatar" className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{emp.fullName}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{emp.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{emp.role}</td>
                      <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">{emp.phone}</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={
                            emp.status === "active"
                              ? "bg-success/10 text-success border-success/20"
                              : emp.status === "on-leave"
                                ? "bg-warning/10 text-warning border-warning/20"
                                : "bg-red-500/10 text-red-500 border border-red-500/20"
                          }
                        >
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">
                        {emp.checkIn ? new Date(emp.checkIn).toLocaleDateString('en-US', {
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        }) : "—"}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">
                        {emp.checkOut ? new Date(emp.checkOut).toLocaleDateString('en-US', {
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        }) : "—"}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">
                        <Trash
                          className="h-5 w-5 text-red-500 hover:text-red-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent row click opening employee detail dialog
                            setEmployeeToDelete(emp);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* View Employee Dialog */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 overflow-hidden">
                  <img
                    src={selectedEmployee.avatar}
                    alt={selectedEmployee.fullName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedEmployee.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.role}</p>
                </div>
              </div>
              <p> Join Date: {selectedEmployee.joinDate
                ? new Date(selectedEmployee.joinDate).toLocaleDateString('en-US', {
                  day: "numeric",
                  year: "numeric",
                  month: "numeric"
                })
                : "—"}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Department</p>
                  <p className="font-medium">{selectedEmployee.department}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Status</p>
                  <Badge
                    variant="outline"
                    className={
                      selectedEmployee.status === "active"
                        ? "bg-success/10 text-success border-success/20"
                        : selectedEmployee.status === "on-leave"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-red-500/10 text-red-500 border border-red-500/20"
                    }
                  >
                    {selectedEmployee.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Check In</p>
                  <p className="font-medium">{
                    selectedEmployee.checkIn
                      ? new Date(selectedEmployee.checkIn).toLocaleDateString('en-US', {
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">Check Out</p>
                  <p className="font-medium">{
                    selectedEmployee.checkOut
                      ? new Date(selectedEmployee.checkOut).toLocaleDateString('en-US', {
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEmployee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEmployee.phone}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!employeeToDelete} onOpenChange={(open) => { if (!open) setEmployeeToDelete(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Remove Employee
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. The employee record will be permanently deleted.
            </DialogDescription>
          </DialogHeader>

          {employeeToDelete && (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 overflow-hidden shrink-0">
                <img
                  src={employeeToDelete.avatar}
                  alt={employeeToDelete.fullName}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold text-sm">{employeeToDelete.fullName}</p>
                <p className="text-xs text-muted-foreground">{employeeToDelete.role}</p>
                <p className="text-xs text-muted-foreground">{employeeToDelete.department}</p>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove <span className="font-medium text-foreground">{employeeToDelete?.fullName}</span> from the system?
          </p>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setEmployeeToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={isDeleting}
              className="gap-2"
            >
              <Trash className="h-4 w-4" />
              {isDeleting ? "Removing..." : "Remove Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  placeholder="Sarah Johnson"
                  value={form.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Role <span className="text-destructive">*</span></Label>
                <Input
                  id="role"
                  placeholder="Engineering Manager"
                  value={form.role}
                  onChange={(e) => handleFormChange("role", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Department <span className="text-destructive">*</span></Label>
              <Select
                value={form.department}
                onValueChange={(val) => handleFormChange("department", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_NAMES.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="joinDate">Join Date <span className="text-destructive">*</span></Label>
                <Input
                  id="joinDate"
                  type="date"
                  value={form.joinDate}
                  onChange={(e) => handleFormChange("joinDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  placeholder="LKR 50,000"
                  value={form.salary}
                  onChange={(e) => handleFormChange("salary", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 pt-1 border-t">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="sarah.j@company.com"
                  value={form.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  placeholder="+94 (71) 012 3123"
                  value={form.phone}
                  onChange={(e) => handleFormChange("phone", e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setForm(EMPTY_FORM); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAddEmployee}
              disabled={!form.name || !form.role || !form.department || !form.email || !form.joinDate}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
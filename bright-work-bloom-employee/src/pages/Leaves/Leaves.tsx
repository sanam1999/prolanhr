// src/pages/EmployeeLeave.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AddLeaveModal } from './AddLeaveModal'
import { Clock, CheckCircle2, XCircle, Plus, FileText } from "lucide-react";
import { C } from "../../colors/color";
import { AppLayout } from "@/components/AppLayout";
import { LeaveRequest, LeaveStatus, LeaveSummary, LeaveType } from "@/types/project.types";
import { LeaveRow } from "./LeaveRow";
import { SummaryCard } from "./SummaryCard";
import { EmptyState } from "@/components/Messagebox";
import { FolderOpen } from "lucide-react";
import { toast } from "../../hooks/use-toast";

// ─── Leave Row ────────────────────────────────────────────────────────────────

export default function EmployeeLeave() {
  const { user: authUser } = useAuth();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [summary, setSummary] = useState<LeaveSummary>({ pending: 0, approved: 0, rejected: 0 });
  const [filter, setFilter] = useState<"all" | LeaveStatus>("all");
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!authUser?.id || !token) return;
    fetchLeaves();
  }, [authUser?.id]);

  const fetchLeaves = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/leaveRequest/${authUser!.id}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 402 || res.status === 403) { navigate("/unauthorized", { replace: true }); return; }
      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const json: LeaveRequest[] = await res.json();
      setLeaves(json);
      setSummary({
        pending: json.filter(l => l.status === "pending").length,
        approved: json.filter(l => l.status === "approved").length,
        rejected: json.filter(l => l.status === "rejected").length,
      });

    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: { type: LeaveType; startDate: string; endDate: string; reason: string }) => {
    setSubmitLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/leaveRequest`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...data, employeeId: authUser!.id }),
        }
      );
      if (!res.ok) throw new Error("Failed to submit request");
      toast({ title: "Success", description: "Leave request submitted successfully" });
      setShowModal(false);
      fetchLeaves(); // refresh list
    } catch (err) {
      const msg = (err as Error).message;
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSubmitLoading(false);
    }
  };

  const filtered = filter === "all" ? leaves : leaves.filter(l => l.status === filter);

  const tabs: { key: "all" | LeaveStatus; label: string; count: number }[] = [
    { key: "all", label: "All", count: leaves.length },
    { key: "pending", label: "Pending", count: summary.pending },
    { key: "approved", label: "Approved", count: summary.approved },
    { key: "rejected", label: "Rejected", count: summary.rejected },
  ];

  return (
    <AppLayout title="Leave Management">
      <div style={{ backgroundColor: C.pageBg, minHeight: "100vh", padding: "28px 32px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>Leave Requests</h1>
            <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>Track and manage your leave history</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 12, border: "none",
              backgroundColor: C.primary, color: "#fff",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Plus size={16} />
            Request Leave
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          <SummaryCard label="Pending" value={summary.pending} color="#f59e0b" icon={Clock} />
          <SummaryCard label="Approved" value={summary.approved} color="#10b981" icon={CheckCircle2} />
          <SummaryCard label="Rejected" value={summary.rejected} color="#ef4444" icon={XCircle} />
        </div>

        {/* Filter tabs */}
        <div style={{
          display: "flex", gap: 6, marginBottom: 20,
          background: C.bg, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 4, width: "fit-content",
        }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)} style={{
              padding: "7px 16px", borderRadius: 9, border: "none",
              backgroundColor: filter === t.key ? C.primary : "transparent",
              color: filter === t.key ? "#fff" : C.sub,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.15s",
            }}>
              {t.label}
              <span style={{
                fontSize: 11, padding: "1px 6px", borderRadius: 10,
                backgroundColor: filter === t.key ? "#ffffff33" : `${C.primary}18`,
                color: filter === t.key ? "#fff" : C.primary,
              }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: C.sub }}>Loading...</div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>
            <button onClick={fetchLeaves} style={{
              padding: "8px 20px", borderRadius: 8, border: "none",
              backgroundColor: C.primary, color: "#fff", cursor: "pointer", fontSize: 13,
            }}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No Leaves Found"
            subtitle="You currently have no leave requests."
            type="default"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(leave => <LeaveRow key={leave._id} leave={leave} />)
            }
          </div>
        )}

      </div>

      {/* Modal */}
      {showModal && (
        <AddLeaveModal
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          loading={submitLoading}
        />
      )}
    </AppLayout>
  );
}

// src/pages/EmployeeLeave.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AddLeaveModal } from './AddLeaveModal'
import {
    Clock, CheckCircle2, XCircle, Plus, FileText
} from "lucide-react";
import { C } from "../../colors/color";
import { LeaveRequest, LeaveStatus, LeaveType} from "@/types/project.types";


// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const daysBetween = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1);
};

const typeLabel: Record<LeaveType, string> = {
    vacation: "Vacation",
    sick: "Sick",
    personal: "Personal",
};

const typeColor: Record<LeaveType, string> = {
    vacation: C.primary,
    sick: "#f59e0b",
    personal: "#8b5cf6",
};

const statusConfig: Record<LeaveStatus, { color: string; bg: string; icon: React.ElementType; label: string }> = {
    pending: { color: "#f59e0b", bg: "#fef3c722", icon: Clock, label: "Pending" },
    approved: { color: "#10b981", bg: "#d1fae522", icon: CheckCircle2, label: "Approved" },
    rejected: { color: "#ef4444", bg: "#fee2e222", icon: XCircle, label: "Rejected" },
};

export function LeaveRow({ leave }: { leave: LeaveRequest }) {
  const sc = statusConfig[leave.status];
  const Icon = sc.icon;
  const days = daysBetween(leave.startDate, leave.endDate);

  return (
    <div style={{
      background: C.bg, border: `1px solid ${C.border}`,
      borderRadius: 14, padding: "16px 20px",
      display: "flex", alignItems: "center", gap: 16,
    }}>
      {/* Type badge */}
      <div style={{
        padding: "4px 10px", borderRadius: 8,
        backgroundColor: `${typeColor[leave.type]}18`,
        color: typeColor[leave.type],
        fontSize: 11, fontWeight: 600, flexShrink: 0,
        letterSpacing: "0.03em",
      }}>
        {typeLabel[leave.type].toUpperCase()}
      </div>

      {/* Dates */}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
          {formatDate(leave.startDate)}
          {leave.startDate !== leave.endDate && ` → ${formatDate(leave.endDate)}`}
        </p>
        <p style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
          {days} {days === 1 ? "day" : "days"}
          {leave.reason && ` · ${leave.reason}`}
        </p>
      </div>

      {/* Applied date */}
      <p style={{ fontSize: 11, color: C.sub, flexShrink: 0 }}>
        Applied {formatDate(leave.createdAt)}
      </p>

      {/* Status */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 12px", borderRadius: 20,
        backgroundColor: sc.bg, flexShrink: 0,
      }}>
        <Icon size={13} color={sc.color} />
        <span style={{ fontSize: 12, fontWeight: 600, color: sc.color }}>{sc.label}</span>
      </div>
    </div>
  );
}
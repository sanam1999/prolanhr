//project page
export interface ProjecType {
    _id: string;
    name: string;
    progress: number;
    members: MemberType[];
}

export interface MemberType {
    _id: string;
    name: string;
    avatar: string;
    
}
//LeaveRequest page

// ─── Types ────────────────────────────────────────────────────────────────────
export type LeaveStatus = "pending" | "approved" | "rejected";
export type LeaveType = "vacation" | "sick" | "personal";

export interface LeaveRequest {
  _id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reason?: string;
  createdAt: string;
}

export interface LeaveSummary {
  pending: number;
  approved: number;
  rejected: number;
}
//Attendance
export interface LogEntry {
  time: string;   // ISO string
  log: string;
}

export interface AttendanceRecord {
  _id: string;
  date: string;         // ISO
  status: "present" | "absent" | "late" | "on-leave";
  checkIn?: string;     // ISO
  checkOut?: string;    // ISO
  workHours: number;
  logs: LogEntry[];
}

export interface TodayAttendance {
  checked: boolean;     // has checked in today
  record?: AttendanceRecord;
}
export type SlotState = "upcoming" | "open" | "closed" | "done";

export interface Holiday {
  IsHoliday : boolean;     // has checked in today
  msg: String;
}

export interface DashboardData {
  employee: {
    id: string;
    name: string;
    role: string;
    department: string;
    avatar: string;
    avatarColor: string;
    joinDate: string;
    status: string;
  };
  attendanceSummary: {
    workingDays: number;
    absentDays: number;
    onLeaveDays: number;
    lateDays: number;
    avgHoursPerDay: number;
    attendanceRate: number;
  };
  projectSummary: {
    totalProjects: number;
    completedProjects: number;
    totalWorkingHours: number;
    attendanceRate: number;
  };
  weeklyHours: { date: string; day: string; hours: number }[];
  attendanceCalendar: { date: string; status: "present" | "absent" | "leave" | "late" }[];
}

// Notification
export interface Notification {
  id: string;
  senderName: string;
  position: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success" | "error";
}

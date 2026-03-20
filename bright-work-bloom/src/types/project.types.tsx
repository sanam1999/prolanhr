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
//projectmanage

export interface Project {
    id: string;
    name: string;
    pct: number;
    employeeid: string[];
}

export interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    departmentName: string;
    status: string;
    joinDate: string;
}

export interface Department {
    id: string;
    name: string;
}

export interface RawProject {
    _id: string;
    name: string;
    progress: number;
    employeeid?: string[];
}

export interface RawEmployee {
    _id: string;
    fullName: string;
    email: string;
    role?: string;
    position?: string;
    jobTitle?: string;
    department: string;
    status?: string;
    joinDate?: string;
}

export interface RawDepartment {
    id: string;
    name: string;
}

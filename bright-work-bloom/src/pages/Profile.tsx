// src/pages/Profile.tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  LogOut, Building2, Mail, Phone, Briefcase,
  Calendar, Shield, Pencil, Check, X, Camera, RefreshCw
} from "lucide-react";
import { toast } from "../hooks/use-toast";

import { useAuth } from "../context/AuthContext";
import { C } from "../colors/color";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Employee {
  _id: string;
  fullName: string;
  email: string;
  avatar: string;
  phone: string;
  department: string;
  role: string;
  status?: string;
  joinDate: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATIC_INFO = { company: "Prolab R", industry: "Technology", annualLeave: 21, sickLeave: 10 };

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function fmtJoinDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Editable Field ───────────────────────────────────────────────────────────
function EditableField({ label, value, icon: Icon, onSave, type = "text" }: {
  label: string;
  value: string;
  icon: React.ElementType;
  onSave: (val: string) => Promise<void>;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft);
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => { setDraft(value); setEditing(false); };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 0",
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: `${C.primary}14`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={15} color={C.primary} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, color: C.sub, marginBottom: 3, letterSpacing: "0.03em" }}>{label}</p>
        {editing ? (
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
            style={{
              width: "100%", fontSize: 14, fontWeight: 500, color: C.text,
              border: "none", borderBottom: `2px solid ${C.primary}`,
              background: "transparent", outline: "none", padding: "2px 0",
            }}
          />
        ) : (
          <p style={{ fontSize: 14, fontWeight: 500, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {value}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {editing ? (
          <>
            <button onClick={handleCancel} style={{
              width: 28, height: 28, borderRadius: 8,
              border: `1px solid ${C.border}`, background: C.pageBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: C.sub,
            }}>
              <X size={13} />
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              width: 28, height: 28, borderRadius: 8,
              border: "none", background: C.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff", opacity: saving ? 0.7 : 1,
            }}>
              {saving ? <RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} style={{
            width: 28, height: 28, borderRadius: 8,
            border: `1px solid ${C.border}`, background: C.pageBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: C.sub,
          }}>
            <Pencil size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Static Info Row ──────────────────────────────────────────────────────────
function StaticRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 0", borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: `${C.primary}14`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={15} color={C.primary} />
      </div>
      <div>
        <p style={{ fontSize: 11, color: C.sub, marginBottom: 3, letterSpacing: "0.03em" }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{value}</p>
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: C.bg, border: `1px solid ${C.border}`,
      borderRadius: 16, padding: "18px 20px", width: "100%",
    }}>
      <p style={{
        fontSize: 10, fontWeight: 700, color: C.sub,
        letterSpacing: "0.08em", marginBottom: 4,
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Profile() {

  const navigate = useNavigate();
  const { logout, user: authUser } = useAuth();
  const token = localStorage.getItem("token");
  const fileRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<Employee | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fetchUser = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile/${authUser?.id}`, {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.status === 402) { navigate("/unauthorized", { replace: true }); return; }
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      setUser(await res.json());
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to fetch profile", variant: "destructive" });
    }
  };

  useEffect(() => { fetchUser(); }, []);

  // ── Patch helper ────────────────────────────────────────────────────────────
  const patchProfile = async (fields: Partial<Employee>) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile/${authUser?.id}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated: Employee = await res.json();
      setUser(updated);

    } catch (err) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
      throw err;
    }
  };

  // ── Avatar upload ────────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ Add file validation
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    // ✅ Optional: Check file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
      return;
    }

    setAvatarLoading(true);
    try {
      const form = new FormData();
      form.append("avatar", file);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile/${authUser?.id}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
          // ✅ Don't set Content-Type - browser handles it for FormData
        },
        body: form,
      });

      if (!res.ok) {
        // ✅ Better error handling
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed with status ${res.status}`);
      }

      const updated: Employee = await res.json();
      setUser(updated);

      // ✅ Reset file input
      if (fileRef.current) {
        fileRef.current.value = "";
      }

      toast({ title: "Success", description: "Avatar updated successfully" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload avatar";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Success", description: "Logged out successfully" });
    navigate("/login", { replace: true });
  };
  // handleLogout()

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (!user) return (
    <AppLayout title="Profile">
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "60vh", flexDirection: "column", gap: 12,
      }}>
        <RefreshCw size={24} color={C.primary} style={{ animation: "spin 1s linear infinite" }} />
        <p style={{ color: C.sub, fontSize: 13 }}>Loading profile...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout title="Profile">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        backgroundColor: C.pageBg, minHeight: "100vh",
        padding: "28px 20px", display: "flex", flexDirection: "column",
        alignItems: "center", gap: 20, margin: "0 auto",
      }}>

        {/* ── Avatar ── */}
        <div style={{ position: "relative", marginBottom: 4 }}>
          <div style={{
            width: 96, height: 96, borderRadius: "50%",
            backgroundColor: C.avatarBg[2],
            border: `3px solid ${C.bg}`,
            boxShadow: `0 0 0 2px ${C.primary}44`,
            overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 700, color: C.primary,
          }}>
            {avatarLoading ? (
              <RefreshCw size={22} color={C.primary} style={{ animation: "spin 1s linear infinite" }} />
            ) : user.avatar ? (
              <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              getInitials(user.fullName)
            )}
          </div>

          {/* Pencil button */}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              position: "absolute", bottom: 2, right: 2,
              width: 28, height: 28, borderRadius: "50%",
              backgroundColor: C.primary, border: `2px solid ${C.bg}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", boxShadow: `0 2px 8px ${C.primary}55`,
            }}
          >
            <Camera size={13} color="#fff" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
        </div>

        {/* ── Name + role ── */}
        <div style={{ textAlign: "center", marginTop: -8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>{user.fullName}</h2>
          <p style={{ fontSize: 13, color: C.primary, fontWeight: 600, marginTop: 3 }}>{user.role}</p>
          <p style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{STATIC_INFO.company}</p>
        </div>

        {/* ── Status badge ── */}
        {user.status && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
            backgroundColor: user.status === "active" ? `${C.primary}18` : "#fef3c7",
            color: user.status === "active" ? C.primary : "#f59e0b",
            textTransform: "capitalize", marginTop: -10,
          }}>
            {user.status}
          </span>
        )}

        {/* ── Personal — editable ── */}
        <SectionCard title="PERSONAL">
          <EditableField
            label="Full Name" value={user.fullName} icon={Mail}
            onSave={val => patchProfile({ fullName: val })}
          />
          <EditableField
            label="Phone" value={user.phone} icon={Phone} type="tel"
            onSave={val => patchProfile({ phone: val })}
          />
          <div style={{ paddingTop: 4 }}>
            <StaticRow label="Email" value={user.email} icon={Mail} />
            <StaticRow label="Joined" value={fmtJoinDate(user.joinDate)} icon={Calendar} />
          </div>
        </SectionCard>

        {/* ── Company — static ── */}
        <SectionCard title="COMPANY">
          <StaticRow label="Company" value={STATIC_INFO.company} icon={Building2} />
          <StaticRow label="Department" value={user.department} icon={Briefcase} />
          <div style={{ borderBottom: "none" }}>
            <StaticRow label="Industry" value={STATIC_INFO.industry} icon={Shield} />
          </div>
        </SectionCard>

        {/* ── Leave policy ── */}
        <SectionCard title="LEAVE POLICY">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
            <div style={{
              backgroundColor: `${C.primary}10`, borderRadius: 12,
              padding: "16px 12px", textAlign: "center",
            }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: C.primary, lineHeight: 1 }}>
                {STATIC_INFO.annualLeave}
              </p>
              <p style={{ fontSize: 11, color: C.sub, marginTop: 5 }}>Annual Leave Days</p>
            </div>
            <div style={{
              backgroundColor: "#d1fae518", borderRadius: 12,
              padding: "16px 12px", textAlign: "center",
            }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#10b981", lineHeight: 1 }}>
                {STATIC_INFO.sickLeave}
              </p>
              <p style={{ fontSize: 11, color: C.sub, marginTop: 5 }}>Sick Leave Days</p>
            </div>
          </div>
        </SectionCard>

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%", padding: "13px", borderRadius: 14,
            border: `1.5px solid #fca5a5`,
            backgroundColor: "#fff1f118", color: "#ef4444",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <LogOut size={15} />
          Log Out
        </button>

      </div>
    </AppLayout>
  );
}
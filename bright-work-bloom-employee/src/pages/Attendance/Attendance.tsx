// src/pages/EmployeeAttendance.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LogIn, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { C } from "../../colors/color";
import { AppLayout } from "@/components/AppLayout";
import { AttendanceRecord, TodayAttendance, Holiday } from "@/types/project.types";
import { DailyLogRow, fmtTime, getSlotState, LOG_SLOTS, LogModal, LogSlotButton } from "./AttendanceHelper";
import { toast } from "../../hooks/use-toast";
import { EmptyState } from "@/components/Messagebox";
import { FolderOpen } from "lucide-react";

function isCheckInAllowed(now: Date): boolean {
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins >= 7 * 60 + 45 && mins <= 13 * 60;
}

function isCheckOutAllowed(now: Date): boolean {
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins >= 12 * 60 && mins <= 18 * 60;
}

function checkInDisabledReason(now: Date): string | null {
    const mins = now.getHours() * 60 + now.getMinutes();
    if (mins < 7 * 60 + 45) return "Check-in opens at 7:45 AM";
    if (mins > 13 * 60) return "Check-in closed after 1:00 PM";
    return null;
}

function checkOutDisabledReason(now: Date, hasCheckedIn: boolean): string | null {
    if (!hasCheckedIn) return "You must check in first";
    const mins = now.getHours() * 60 + now.getMinutes();
    if (mins < 12 * 60) return "Check-out opens at 12:00 PM";
    if (mins > 23 * 60) return "Check-out closed after 4:00 PM";
    return null;
}

// ─── Build submittedSlots properly from real log data ─────────────────────────
function buildSubmittedSlots(logs: { time: string }[]): Set<string> {
    const set = new Set<string>();
    logs.forEach(entry => {
        const logTime = new Date(entry.time);
        LOG_SLOTS.forEach(slot => {
            const slotStart = new Date(logTime);
            slotStart.setHours(slot.hour, slot.minute, 0, 0);
            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slot.minute + 30);
            if (logTime >= slotStart && logTime < slotEnd) {
                set.add(`${slot.hour}:${slot.minute}`);
            }
        });
    });
    return set;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EmployeeAttendance() {
    const { user: authUser } = useAuth();
    const token = localStorage.getItem("token");
    const navigate = useNavigate();

    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [today, setToday] = useState<TodayAttendance>({ checked: false });
    const [holiday, setHoliday] = useState<Holiday>({ IsHoliday: true, msg: "Please connect to the internet" });
    const [now, setNow] = useState(new Date());
    const [submittedSlots, setSubmittedSlots] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [checkLoading, setCheckLoading] = useState(false);
    const [logLoading, setLogLoading] = useState(false);
    const [activeSlot, setActiveSlot] = useState<typeof LOG_SLOTS[0] | null>(null);
    const [logError, setLogError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Live clock — tick every 30 seconds
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (!authUser?.id || !token) return;
        fetchAttendance();
    }, [authUser?.id]);

    const fetchAttendance = async () => {
        setLoading(true);
        setError(null);
        try {
            const [attendanceRes, holidayRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_BASE_URL}/attendance/${authUser!.id}`, {
                    headers: { "Authorization": `Bearer ${token}` },
                }),
                fetch(`${import.meta.env.VITE_API_BASE_URL}/holiday/today`, {
                    headers: { "Authorization": `Bearer ${token}` },
                }),
            ]);

            if (attendanceRes.status === 402 || attendanceRes.status === 402) {
                navigate("/unauthorized", { replace: true });
                return;
            }
            if (!attendanceRes.ok) throw new Error(`Server error: ${attendanceRes.status}`);

            const json: AttendanceRecord[] = await attendanceRes.json();

            if (holidayRes.ok) {
                const holidayData: Holiday = await holidayRes.json();
                setHoliday(holidayData);
            }

            const sorted = [...json].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setRecords(sorted);

            const todayKey = new Date().toISOString().slice(0, 10);
            const todayRecord = sorted.find(r => r.date.slice(0, 10) === todayKey);
            if (todayRecord) {
                setToday({ checked: true, record: todayRecord });
                setSubmittedSlots(buildSubmittedSlots(todayRecord.logs));
            } else {
                setSubmittedSlots(new Set());
            }

        } catch (err) {
            const msg = (err as Error).message;
            setError(msg);
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Check In
    const handleCheckIn = async () => {
        setCheckLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/attendance/checkin`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ employeeId: authUser!.id }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast({ title: "Error", description: data.message ?? "Check-in failed", variant: "destructive" });
                return;
            }
            toast({ title: "Success", description: data.message ?? "Checked in successfully" });
            await fetchAttendance();
        } catch (err) {
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        } finally {
            setCheckLoading(false);
        }
    };

    // Check Out
    const handleCheckOut = async () => {
        setCheckLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/attendance/checkout`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ employeeId: authUser!.id }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast({ title: "Error", description: data.message ?? "Check-out failed", variant: "destructive" });
                return;
            }
            toast({ title: "Success", description: data.message ?? "Checked out successfully" });
            await fetchAttendance();
        } catch (err) {
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        } finally {
            setCheckLoading(false);
        }
    };

    // Add Log
    const handleAddLog = async (note: string) => {
        if (!activeSlot) return;
        setLogLoading(true);
        setLogError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/attendance/log`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ employeeId: authUser!.id, note }),
            });
            const data = await res.json();
            if (!res.ok) {
                setLogError(data.message ?? "Failed to add log");
                toast({ title: "Error", description: data.message ?? "Failed to add log", variant: "destructive" });
                return;
            }
            toast({ title: "Success", description: "Log saved successfully" });
            setActiveSlot(null);
            setLogError(null);
            await fetchAttendance();
        } catch (err) {
            const msg = (err as Error).message;
            setLogError(msg);
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setLogLoading(false);
        }
    };

    const handleDeleteLog = async (recordId: string, logIndex: number) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/attendance/log`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ recordId, logIndex }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast({ title: "Error", description: data.message ?? "Failed to delete log", variant: "destructive" });
                return;
            }
            toast({ title: "Success", description: "Log deleted successfully" });
            await fetchAttendance();
        } catch (err) {
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        }
    };

    // Guard: prevent opening modal for an already-submitted slot
    const handleSlotClick = (slot: typeof LOG_SLOTS[0]) => {
        const key = `${slot.hour}:${slot.minute}`;
        if (submittedSlots.has(key)) return;
        setLogError(null);
        setActiveSlot(slot);
    };

    const hasCheckedIn = today.checked && !!today.record?.checkIn;
    const hasCheckedOut = today.checked && !!today.record?.checkOut;

    const checkInAllowed = isCheckInAllowed(now);
    const checkOutAllowed = isCheckOutAllowed(now);
    const checkInReason = checkInDisabledReason(now);

    const checkOutDisabled = checkLoading || !hasCheckedIn || !checkOutAllowed;
    const checkOutReason = checkOutDisabledReason(now, hasCheckedIn);

    const checkInDisabled = checkLoading || holiday.IsHoliday || !checkInAllowed;

    const todayDateStr = now.toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
    });

    return (
        <AppLayout title="Attendance">
            <div style={{ backgroundColor: C.pageBg, minHeight: "100vh", padding: "28px 32px" }}>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>Attendance</h1>
                    <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>{todayDateStr}</p>
                </div>

                {/* Today card */}
                <div style={{
                    background: C.bg, border: `1px solid ${C.border}`,
                    borderRadius: 18, padding: 24, marginBottom: 24,
                }}>
                    <div style={{
                        display: "flex", alignItems: "flex-start",
                        justifyContent: "space-between", gap: 20, flexWrap: "wrap",
                    }}>
                        {/* Check in/out info */}
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 600, color: C.sub, letterSpacing: "0.05em", marginBottom: 10 }}>
                                TODAY
                            </p>
                            <div style={{ display: "flex", gap: 24 }}>
                                <div>
                                    <p style={{ fontSize: 11, color: C.sub, marginBottom: 3 }}>Check In</p>
                                    <p style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "monospace" }}>
                                        {today.record?.checkIn ? fmtTime(today.record.checkIn) : "—"}
                                    </p>
                                </div>
                                <div style={{ width: 1, backgroundColor: C.border }} />
                                <div>
                                    <p style={{ fontSize: 11, color: C.sub, marginBottom: 3 }}>Check Out</p>
                                    <p style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "monospace" }}>
                                        {today.record?.checkOut ? fmtTime(today.record.checkOut) : "—"}
                                    </p>
                                </div>
                                <div style={{ width: 1, backgroundColor: C.border }} />
                                <div>
                                    <p style={{ fontSize: 11, color: C.sub, marginBottom: 3 }}>Hours</p>
                                    <p style={{ fontSize: 18, fontWeight: 700, color: C.text, fontFamily: "monospace" }}>
                                        {today.record?.workHours ? `${today.record.workHours}h` : "—"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Check in/out buttons */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                            {!hasCheckedIn ? (
                                <>
                                    <button
                                        onClick={handleCheckIn}
                                        disabled={checkInDisabled}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 8,
                                            padding: "11px 20px", borderRadius: 12, border: "none",
                                            backgroundColor: checkInDisabled ? C.disabledBg : C.primary,
                                            color: checkInDisabled ? C.disabledText : "#fff",
                                            fontSize: 13, fontWeight: 600,
                                            cursor: checkInDisabled ? "not-allowed" : "pointer",
                                            boxShadow: checkInDisabled ? "none" : `0 4px 14px ${C.primary}44`,
                                            opacity: checkLoading ? 0.7 : 1,
                                        }}
                                    >
                                        <LogIn size={16} />
                                        {checkLoading ? "..." : "Check In"}
                                    </button>
                                    {(holiday.IsHoliday || checkInReason) && (
                                        <p style={{ fontSize: 12, color: "#dc2626", display: "flex", alignItems: "center", gap: 4 }}>
                                            <AlertCircle size={12} color="#dc2626" />
                                            {holiday.IsHoliday ? holiday.msg : checkInReason}
                                        </p>
                                    )}
                                </>
                            ) : !hasCheckedOut ? (
                                <>
                                    <button
                                        onClick={handleCheckOut}
                                        disabled={checkOutDisabled}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 8,
                                            padding: "11px 20px", borderRadius: 12,
                                            border: checkOutDisabled ? `1.5px solid ${C.border}` : `1.5px solid #ef4444`,
                                            backgroundColor: checkOutDisabled ? C.disabledBg : "#fee2e210",
                                            color: checkOutDisabled ? C.disabledText : "#ef4444",
                                            fontSize: 13, fontWeight: 600,
                                            cursor: checkOutDisabled ? "not-allowed" : "pointer",
                                            opacity: checkLoading ? 0.7 : 1,
                                        }}
                                    >
                                        <LogOut size={16} />
                                        {checkLoading ? "..." : "Check Out"}
                                    </button>
                                    {checkOutReason && (
                                        <p style={{ fontSize: 12, color: C.sub, display: "flex", alignItems: "center", gap: 4 }}>
                                            <AlertCircle size={12} color={C.sub} />
                                            {checkOutReason}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 6,
                                    padding: "11px 20px", borderRadius: 12,
                                    backgroundColor: `${C.primary}12`, color: C.primary,
                                    fontSize: 13, fontWeight: 600,
                                }}>
                                    <CheckCircle2 size={16} />
                                    Done for today
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Log slots */}
                    {hasCheckedIn && !hasCheckedOut && (
                        <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: C.sub, letterSpacing: "0.05em", marginBottom: 16 }}>
                                WORK LOG SLOTS · Add within 30 min window
                            </p>
                            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                                {LOG_SLOTS.map(slot => (
                                    <LogSlotButton
                                        key={slot.label}
                                        slot={slot}
                                        state={getSlotState(slot, now, submittedSlots)}
                                        onClick={() => handleSlotClick(slot)}
                                    />
                                ))}
                            </div>
                            <p style={{ fontSize: 11, color: C.sub, marginTop: 14, display: "flex", alignItems: "center", gap: 5 }}>
                                <AlertCircle size={12} color={C.sub} />
                                Each slot is open for 30 minutes from the scheduled time
                            </p>
                        </div>
                    )}
                </div>

                {/* Daily logs */}
                <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.sub, letterSpacing: "0.06em", marginBottom: 14 }}>
                        DAILY LOGS
                    </p>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: 40, color: C.sub, fontSize: 13 }}>Loading...</div>

                    ) : records.length === 0 ? (
                        <EmptyState
                            icon={FolderOpen}
                            title="No Attendance Records"
                            subtitle="You don't have any attendance records yet."
                            type="default"
                        />


                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {records.map(r => (
                                <DailyLogRow key={r._id} record={r} onDelete={handleDeleteLog} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Log modal */}
            {activeSlot && (
                <LogModal
                    slotLabel={activeSlot.label}
                    onClose={() => { setActiveSlot(null); setLogError(null); }}
                    onSubmit={handleAddLog}
                    loading={logLoading}
                />
            )}
        </AppLayout>
    );
}
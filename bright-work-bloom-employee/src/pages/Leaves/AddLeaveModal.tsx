// src/pages/EmployeeLeave.tsx
import { useState } from "react";

import {
    X, ChevronDown,
} from "lucide-react";
import { C } from "../../colors/color";
import { toast } from "../../hooks/use-toast";

type LeaveType = "vacation" | "sick" | "personal";



export function AddLeaveModal({ onClose, onSubmit, loading }: {
    onClose: () => void;
    onSubmit: (data: { type: LeaveType; startDate: string; endDate: string; reason: string }) => Promise<void>;
    loading: boolean;
}) {
    const [type, setType] = useState<LeaveType>("vacation");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!startDate || !endDate) { setError("Please select both dates."); toast({ title: "Error", description: "Please select both dates", variant: "destructive" }); return; }
        if (new Date(endDate) < new Date(startDate)) { setError("End date must be after start date."); toast({ title: "Error", description: "End date must be after start date", variant: "destructive" }); return; }
        setError("");
        await onSubmit({ type, startDate, endDate, reason });
    };

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "10px 12px", borderRadius: 10,
        border: `1px solid ${C.border}`, background: C.pageBg,
        fontSize: 13, color: C.text, outline: "none",
        boxSizing: "border-box",
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 11, fontWeight: 600, color: C.sub,
        letterSpacing: "0.05em", marginBottom: 6, display: "block",
    };

    return (
        <div style={{
            position: "fixed", inset: 0, backgroundColor: "#00000044",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000, padding: 20,
        }}>
            <div style={{
                background: C.bg, borderRadius: 20, padding: 28,
                width: "100%", maxWidth: 440,
                border: `1px solid ${C.border}`,
                boxShadow: "0 20px 60px #00000018",
            }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <div>
                        <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0 }}>Request Leave</h2>
                        <p style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>Fill in the details below</p>
                    </div>
                    <button onClick={onClose} style={{
                        width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
                        background: C.pageBg, cursor: "pointer", color: C.sub,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <X size={15} />
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Type */}
                    <div>
                        <label style={labelStyle}>LEAVE TYPE</label>
                        <div style={{ position: "relative" }}>
                            <select
                                value={type}
                                onChange={e => setType(e.target.value as LeaveType)}
                                style={{ ...inputStyle, appearance: "none", paddingRight: 36, cursor: "pointer" }}
                            >
                                <option value="vacation">Vacation</option>
                                <option value="sick">Sick</option>
                                <option value="personal">Personal</option>
                            </select>
                            <ChevronDown size={14} style={{
                                position: "absolute", right: 12, top: "50%",
                                transform: "translateY(-50%)", color: C.sub, pointerEvents: "none",
                            }} />
                        </div>
                    </div>

                    {/* Dates */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <label style={labelStyle}>START DATE</label>
                            <input type="date" value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>END DATE</label>
                            <input type="date" value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                min={startDate}
                                style={inputStyle} />
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label style={labelStyle}>REASON <span style={{ color: C.sub, fontWeight: 400 }}>(optional)</span></label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Briefly describe the reason..."
                            rows={3}
                            style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }}
                        />
                    </div>

                    {error && (
                        <p style={{ fontSize: 12, color: "#ef4444", marginTop: -8 }}>{error}</p>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                        <button onClick={onClose} style={{
                            flex: 1, padding: "11px", borderRadius: 10,
                            border: `1px solid ${C.border}`, background: C.pageBg,
                            fontSize: 13, fontWeight: 600, color: C.sub, cursor: "pointer",
                        }}>
                            Cancel
                        </button>
                        <button onClick={handleSubmit} disabled={loading} style={{
                            flex: 2, padding: "11px", borderRadius: 10, border: "none",
                            backgroundColor: C.primary, color: "#fff",
                            fontSize: 13, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                            opacity: loading ? 0.7 : 1,
                        }}>
                            {loading ? "Submitting..." : "Submit Request"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
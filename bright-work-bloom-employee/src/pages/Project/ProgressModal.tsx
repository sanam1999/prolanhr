import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { C } from '../../colors/color'
import { toast } from "../../hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { ProjecType } from "@/types/project.types";

export function ProgressModal({ project, open, onClose, onSave }: {
    project: ProjecType;
    open: boolean;
    onClose: () => void;
    onSave: (v: number) => void;
}) {
    const maxAdd = 100 - project.progress;
    const [val, setVal] = useState("");
    const [err, setErr] = useState("");

    const handleSave = () => {
        const n = Number(val);
        if (!val || isNaN(n)) { setErr("Please enter a valid number."); return; }
        if (n < 1) { setErr("Minimum value is 1."); return; }
        if (n > maxAdd) { setErr(`Maximum is ${maxAdd} (100 − ${project.progress}%).`); return; }
        onSave(n);
        toast({ title: "Success", description: "Progress updated successfully" });
        setVal(""); setErr("");
    };

    const handleClose = () => { setVal(""); setErr(""); onClose(); };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
            <DialogContent className="sm:max-w-[380px]" style={{ borderRadius: 16 }}>
                <DialogHeader>
                    <DialogDescription style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: C.sub, textTransform: "uppercase", marginBottom: 2 }}>
                        Update Progress
                    </DialogDescription>
                    <DialogTitle style={{ fontSize: 17, color: C.text }}>{project.name}</DialogTitle>
                </DialogHeader>

                <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: C.badgeBg, border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>Current Progress</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: C.primary, fontFamily: "'DM Mono', monospace" }}>{project.progress}%</span>
                </div>

                <div className="flex flex-col gap-2 mt-1">
                    <Label style={{ fontSize: 12, fontWeight: 600, color: C.sub, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                        Add Progress — min: 1 / max: {maxAdd}
                    </Label>
                    <Input
                        type="number" min={1} max={maxAdd} value={val}
                        onChange={(e) => { setVal(e.target.value); setErr(""); }}
                        placeholder={`Enter 1 – ${maxAdd}`}
                        style={{ fontFamily: "'DM Mono', monospace", borderColor: err ? C.error : C.border, color: C.text }}
                    />
                    {err && <p style={{ fontSize: 12, color: C.error, fontWeight: 500 }}>{err}</p>}
                </div>

                <DialogFooter className="flex gap-2 mt-2">
                    <Button variant="outline" onClick={handleClose} className="flex-1" style={{ color: C.sub, borderColor: C.border }}>Cancel</Button>
                    <Button onClick={handleSave} className="flex-[2]" style={{ background: C.primary, color: "#fff", boxShadow: "0 3px 10px rgba(61,140,110,0.3)" }}>Save Progress</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
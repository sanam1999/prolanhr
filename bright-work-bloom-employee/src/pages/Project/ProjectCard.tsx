import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { C } from '../../colors/color'
import { ProjecType } from "@/types/project.types";
import { CircularProgress } from './CircularProgress'

export function ProjectCard({ project, onUpdateProgress }: { project: ProjecType; onUpdateProgress: (id: string) => void }) {
    const done = project.progress >= 100;
    const status = done ? "Completed" : project.progress >= 50 ? "In Progress" : "Just Started";

    return (
        <Card className="flex flex-col gap-4 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ minHeight: 300, borderColor: C.border, background: C.bg, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
        >
            <div className="flex items-center gap-4">
                <CircularProgress progress={project.progress} size={100} />
                <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: C.sub, textTransform: "uppercase", marginBottom: 2 }}>Project</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.35, marginBottom: 6 }}>{project.name}</p>
                    <Badge style={{ background: C.badgeBg, color: C.primary, border: "none", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", paddingLeft: 8, paddingRight: 8 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.primary, display: "inline-block", marginRight: 5 }} />
                        {status}
                    </Badge>
                </div>
            </div>

            <div style={{ height: 1, background: C.border }} />

            <div className="flex flex-col gap-1">
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: C.sub, textTransform: "uppercase", marginBottom: 6 }}>Enrolled Members</p>
                <div className="flex flex-col gap-2">
                    {project.members.map((m, i) => (
                        <div key={m._id} className="flex items-center gap-2.5">
                            <div className="shrink-0 h-10 w-10 rounded-full overflow-hidden bg-primary/10">
                                <img src={m.avatar} alt="avatar" className="h-full w-full object-cover" />
                            </div>
                            <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{m.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <Button onClick={() => !done && onUpdateProgress(project._id)} disabled={done}
                className="mt-auto w-full font-bold tracking-wide"
                style={{ background: done ? C.disabledBg : C.primary, color: done ? C.disabledText : "#fff", border: "none", boxShadow: done ? "none" : "0 3px 10px rgba(61,140,110,0.3)", cursor: done ? "not-allowed" : "pointer" }}
            >
                {done ? "✓ Completed" : "+ Add Progress"}
            </Button>
        </Card>
    );
}
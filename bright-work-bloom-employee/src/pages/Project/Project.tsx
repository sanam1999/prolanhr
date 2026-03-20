import { useState, useEffect } from "react";
import { FolderOpen } from "lucide-react";
import { EmptyState, LoadingState } from "../../components/Messagebox";
import { C } from '../../colors/color'
import { ProjectCard } from './ProjectCard'
import { AppLayout } from "@/components/AppLayout";
import { toast } from "../../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ProjecType } from "@/types/project.types";
import { ProgressModal } from "./ProgressModal";

export default function Project() {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const token = localStorage.getItem("token");
    const [projects, setProjects] = useState<ProjecType[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);
    const active = projects.find((p) => p._id === activeId) ?? null;
    async function getProjects() {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/project/${authUser.id}`,
                { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
            );
            if (res.status === 402) { navigate("/unauthorized", { replace: true }); return; }
            if (!res.ok) throw new Error(`Request failed: ${res.status}`);
            const data: ProjecType[] = await res.json();
            setProjects(data);
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to load projects", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => { getProjects(); }, []);
    const handleSave = async (add: number) => {
        if (!activeId) return;
        setProjects((prev) =>
            prev.map((p) => p._id === activeId ? { ...p, progress: Math.min(100, p.progress + add) } : p)
        );
        setActiveId(null);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/project/updateprogres/${activeId}`,
                {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ progress: add }),
                }
            );
            if (res.status === 402) { navigate("/unauthorized", { replace: true }); return; }
            if (!res.ok) throw new Error("Failed to update progress");
            toast({ title: "Success", description: "Progress updated successfully" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to update progress", variant: "destructive" });
            getProjects();
        }
    };
    return (
        <AppLayout title="Projects">
            <div className="min-h-screen p-8" style={{ background: C.pageBg }}>
                <div className="mb-8">
                    <h3 style={{ fontSize: 19, fontWeight: 500, color: C.text, letterSpacing: "-0.5px" }}>
                        Track and update your team's project progress
                    </h3>
                </div>
                {loading ? (
                    <LoadingState />
                ) : projects.length === 0 ? (
                    <EmptyState
                        icon={FolderOpen}
                        title="No projects assigned yet"
                        subtitle="You don't have any projects assigned to you. Contact your manager to get started."
                        type="default"
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {projects.map((p) => (
                            <ProjectCard key={p._id} project={p} onUpdateProgress={setActiveId} />
                        ))}
                    </div>
                )}
                {active && (
                    <ProgressModal
                        project={active}
                        open={!!activeId}
                        onClose={() => setActiveId(null)}
                        onSave={handleSave}
                    />
                )}
            </div>
        </AppLayout>
    );
}
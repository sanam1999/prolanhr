import { Loader2, LucideIcon } from "lucide-react";

// ── Design tokens (shared) ────────────────────────────────────────────────────
const ACCENT = "#3d8c6e";
const ACCENT_LT = "#eaf5ef";
const TEXT = "#1c2b25";
const TEXT3 = "#8a8a8a";
const ERROR = "#dc2626";
const ERROR_LT = "#fef2f2";

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    type?: "default" | "error";
}

export function EmptyState({ icon: Icon, title, subtitle, type = "default" }: EmptyStateProps) {
    const isError = type === "error";
    const iconColor = isError ? ERROR : ACCENT;
    const bgColor = isError ? ERROR_LT : ACCENT_LT;
    const titleColor = isError ? ERROR : TEXT;

    return (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
            <div
                className="flex items-center justify-center rounded-2xl mb-5"
                style={{ width: 72, height: 72, background: bgColor }}
            >
                <Icon style={{ width: 34, height: 34, color: iconColor, opacity: 0.8 }} />
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: titleColor, marginBottom: 6 }}>
                {title}
            </p>
            <p style={{ fontSize: 14, color: TEXT3, maxWidth: 300, lineHeight: 1.6 }}>
                {subtitle}
            </p>
        </div>
    );
}

export function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 style={{ width: 32, height: 32, color: ACCENT, animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 14, color: TEXT3, fontWeight: 500 }}>Loading projects…</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
    );
}

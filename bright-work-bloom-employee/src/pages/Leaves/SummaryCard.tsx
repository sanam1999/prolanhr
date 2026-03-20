import { C } from "../../colors/color";

export function SummaryCard({ label, value, color, icon: Icon }: {
    label: string; value: number; color: string; icon: React.ElementType;
}) {
    return (
        <div style={{
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "20px 24px",
            display: "flex", alignItems: "center", gap: 14,
        }}>
            <div style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: `${color}18`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
                <Icon size={20} color={color} />
            </div>
            <div>
                <p style={{ fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>{label}</p>
            </div>
        </div>
    );
}
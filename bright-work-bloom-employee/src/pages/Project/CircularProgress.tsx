import { C } from '../../colors/color';

export function CircularProgress({ progress, size = 100 }: { progress: number; size?: number }) {
    const sw = 7;
    const r = (size - sw * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (progress / 100) * circ;
    const c = size / 2;

    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                <circle cx={c} cy={c} r={r} fill="none" stroke={C.track} strokeWidth={sw} />
                <circle
                    cx={c} cy={c} r={r} fill="none"
                    stroke={C.primary} strokeWidth={sw}
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.55s ease" }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span style={{ fontSize: 17, fontWeight: 700, color: C.primary, fontFamily: "'DM Mono', monospace" }}>
                    {progress}%
                </span>
            </div>
        </div>
    );
}
import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Bell, Check, CheckCheck, Trash2, Wifi, WifiOff, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "../hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Notification } from "../types/project.types"


const TYPE_STYLES: Record<Notification["type"], { badge: string; dot: string; ring: string }> = {
    success: { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", ring: "ring-emerald-200" },
    warning: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500", ring: "ring-amber-200" },
    info: { badge: "bg-sky-100 text-sky-700", dot: "bg-sky-500", ring: "ring-sky-200" },
    error: { badge: "bg-red-100 text-red-700", dot: "bg-red-500", ring: "ring-red-200" },
};

const AVATAR_COLORS = [
    "bg-violet-100 text-violet-700",
    "bg-pink-100 text-pink-700",
    "bg-sky-100 text-sky-700",
    "bg-amber-100 text-amber-700",
    "bg-emerald-100 text-emerald-700",
    "bg-rose-100 text-rose-700",
];

function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Token helper ─────────────────────────────────────────────────────────────

function getToken() {
    return localStorage.getItem("token") ?? "";
}

// ─── SSE Hook ─────────────────────────────────────────────────────────────────

type SSEStatus = "connecting" | "connected" | "disconnected";

function useNotificationSSE(onNotification: (n: Notification) => void) {
    const [status, setStatus] = useState<SSEStatus>("disconnected");
    const esRef = useRef<EventSource | null>(null);

    useEffect(() => {
        function connect() {
            setStatus("connecting");
            const url = `${import.meta.env.VITE_API_BASE_URL}/notifications/stream?token=${encodeURIComponent(getToken())}`;
            const es = new EventSource(url);
            esRef.current = es;

            es.onopen = () => setStatus("connected");

            es.onmessage = (e) => {
                try {
                    const notification: Notification = JSON.parse(e.data);
                    onNotification(notification);
                } catch {
                    // ignore malformed events
                }
            };

            es.onerror = () => {
                setStatus("disconnected");
                es.close();
                setTimeout(connect, 5000);
            };
        }

        connect();
        return () => {
            esRef.current?.close();
            setStatus("disconnected");
        };
    }, []); 

    return status;
}

async function apiFetchAll(
    navigate: ReturnType<typeof useNavigate>
): Promise<Notification[] | null> {
    try {
        const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/notifications`,
            {
                headers: {
                    "Authorization": `Bearer ${getToken()}`,
                    "Content-Type": "application/json",
                },
            }
        );
        if (res.status === 401 || res.status === 403) {
            navigate("/unauthorized", { replace: true });
            return null;
        }
        if (!res.ok) return null;
        return res.json();
    } catch {
        toast({ title: "Error", description: "Failed to fetch notifications", variant: "destructive" });
        return null;
    }
}

async function apiMarkRead(id: string) {
    try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/${id}/read`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${getToken()}` },
        });
    } catch {
        toast({ title: "Error", description: "Failed to mark notification as read", variant: "destructive" });
    }
}

async function apiMarkAllRead() {
    try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/read-all`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${getToken()}` },
        });
        toast({ title: "Success", description: "All notifications marked as read" });
    } catch {
        toast({ title: "Error", description: "Failed to mark all as read", variant: "destructive" });
    }
}

async function apiDelete(id: string) {
    try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${getToken()}` },
        });
        toast({ title: "Success", description: "Notification removed" });
    } catch {
        toast({ title: "Error", description: "Failed to delete notification", variant: "destructive" });
    }
}

async function apiClearAll() {
    try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${getToken()}` },
        });
        toast({ title: "Success", description: "All notifications cleared" });
    } catch {
        toast({ title: "Error", description: "Failed to clear notifications", variant: "destructive" });
    }
}

export default function Notifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        apiFetchAll(navigate).then((data) => {
            if (data) {
                setNotifications(data);
                setError(false);
            } else {
                setError(true);
            }
            setLoading(false);
        });
    }, []);

    const sseStatus = useNotificationSSE((newNotif) => {
        setNotifications((prev) => {
            if (prev.find((n) => n.id === newNotif.id)) return prev;
            toast({ title: "New Notification", description: newNotif.title });
            return [newNotif, ...prev];
        });
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    const refresh = async () => {
        setLoading(true);
        setError(false);
        const data = await apiFetchAll(navigate);
        if (data) {
            setNotifications(data);
            toast({ title: "Success", description: "Notifications refreshed" });
        } else {
            setError(true);
        }
        setLoading(false);
    };

    const markAsRead = (id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        apiMarkRead(id);
    };

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        apiMarkAllRead();
    };

    const deleteNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        apiDelete(id);
    };

    const clearAll = () => {
        setNotifications([]);
        apiClearAll();
    };

    return (
        <AppLayout unreadCount={unreadCount}>
            <div className="p-6 max-w-3xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-100 rounded-xl">
                            <Bell className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
                            <p className="text-sm text-gray-500">
                                {loading ? "Loading…" : unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <Badge className="bg-violet-600 text-white">{unreadCount}</Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${sseStatus === "connected"
                            ? "bg-emerald-100 text-emerald-700"
                            : sseStatus === "connecting"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-500"
                            }`}>
                            {sseStatus === "connected" ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            {sseStatus === "connected" ? "Live" : sseStatus === "connecting" ? "Connecting…" : "Offline"}
                        </span>

                        <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="gap-1 text-xs">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>

                        {unreadCount > 0 && (
                            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1 text-xs">
                                <CheckCheck className="w-4 h-4" /> Mark all read
                            </Button>
                        )}

                        {notifications.length > 0 && (
                            <Button
                                variant="outline" size="sm" onClick={clearAll}
                                className="gap-1 text-xs text-red-500 border-red-200 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" /> Clear all
                            </Button>
                        )}
                    </div>
                </div>

                {/* Body */}
                {loading ? (
                    <Card className="p-12 text-center text-gray-400">
                        <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin opacity-40" />
                        <p className="text-sm">Loading notifications…</p>
                    </Card>
                ) : error ? (
                    <Card className="p-12 text-center text-gray-400">
                        <WifiOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium text-gray-600 mb-1">Failed to load notifications</p>
                        <p className="text-xs text-gray-400 mb-4">Check your connection or try again</p>
                        <Button size="sm" variant="outline" onClick={refresh} className="gap-1 text-xs">
                            <RefreshCw className="w-3.5 h-3.5" /> Try again
                        </Button>
                    </Card>
                ) : notifications.length === 0 ? (
                    <Card className="p-12 text-center text-gray-400">
                        <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No notifications</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((n, i) => (
                            <Card
                                key={n.id}
                                className={`p-4 transition-all border ${!n.read
                                    ? `border-violet-200 bg-violet-50/40 ring-1 ${TYPE_STYLES[n.type].ring}`
                                    : "bg-white"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                                        {getInitials(n.senderName)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div>
                                                <span className="text-sm font-semibold text-gray-900">{n.senderName}</span>
                                                <span className="text-xs text-gray-400 ml-2">{n.position}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLES[n.type].badge}`}>
                                                    {n.type}
                                                </span>
                                                <span className="text-xs text-gray-400">{n.time}</span>
                                                {!n.read && (
                                                    <span className={`w-2 h-2 rounded-full shrink-0 ${TYPE_STYLES[n.type].dot}`} />
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium text-gray-800 mt-1">{n.title}</p>
                                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                        <div className="flex gap-2 mt-3">
                                            {!n.read && (
                                                <Button size="sm" variant="outline" className="text-xs h-7 px-3 gap-1" onClick={() => markAsRead(n.id)}>
                                                    <Check className="w-3 h-3" /> Mark as read
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="text-xs h-7 px-3 gap-1 text-red-500 hover:bg-red-50" onClick={() => deleteNotification(n.id)}>
                                                <Trash2 className="w-3 h-3" /> Remove
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
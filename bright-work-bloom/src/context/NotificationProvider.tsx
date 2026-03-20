import {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { toast } from "../hooks/use-toast";

// ─── Types ─────────────────────────────────────────────────────────────

export interface Notification {
    id: string;
    senderName: string;
    position: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: "info" | "warning" | "success" | "error";
}

type SSEStatus = "connecting" | "connected" | "disconnected";

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    sseStatus: SSEStatus;
    loading: boolean;
    error: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => void;
    markAllRead: () => void;
    deleteNotification: (id: string) => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ─── Token Helper ──────────────────────────────────────────────────────

function getToken() {
    return localStorage.getItem("token") ?? "";
}

// ─── API Helpers ───────────────────────────────────────────────────────

async function apiFetchAll(): Promise<Notification[] | null> {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications`, {
            headers: {
                Authorization: `Bearer ${getToken()}`,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function apiMarkRead(id: string) {
    try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/${id}/read`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${getToken()}` },
        });
    } catch {
        toast({ title: "Error", description: "Failed to mark notification as read", variant: "destructive" });
    }
}

async function apiMarkAllRead() {
    try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/read-all`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${getToken()}` },
        });
    } catch {
        toast({ title: "Error", description: "Failed to mark all as read", variant: "destructive" });
    }
}

async function apiDelete(id: string) {
    try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${getToken()}` },
        });
    } catch {
        toast({ title: "Error", description: "Failed to delete notification", variant: "destructive" });
    }
}

async function apiClearAll() {
    try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${getToken()}` },
        });
    } catch {
        toast({ title: "Error", description: "Failed to clear notifications", variant: "destructive" });
    }
}

// ─── Provider ──────────────────────────────────────────────────────────

interface NotificationProviderProps {
    children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
    const location = useLocation();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [sseStatus, setSseStatus] = useState<SSEStatus>("disconnected");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const esRef = useRef<EventSource | null>(null);

    const token = getToken();
    const isLoginPage = location.pathname === "/login";

    // ─── Fetch Notifications ───────────────────────────────────────────

    const fetchNotifications = async () => {
        if (!token || isLoginPage) return;

        setLoading(true);
        setError(false);

        const data = await apiFetchAll();

        if (data) {
            setNotifications(data);
        } else {
            setError(true);
            toast({
                title: "Error",
                description: "Failed to load notifications",
                variant: "destructive",
            });
        }

        setLoading(false);
    };

    // ─── Run Fetch on Route Change ─────────────────────────────────────

    useEffect(() => {
        fetchNotifications();
    }, [location.pathname]);

    // ─── SSE Connection ────────────────────────────────────────────────

    useEffect(() => {
        // ❌ Skip if not logged in OR on login page
        if (!token || isLoginPage) {
            esRef.current?.close();
            setSseStatus("disconnected");
            return;
        }

        let isMounted = true;

        function connectSSE() {
            if (!isMounted) return;

            setSseStatus("connecting");

            const url = `${import.meta.env.VITE_API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
            const es = new EventSource(url);
            esRef.current = es;

            es.onopen = () => {
                if (isMounted) setSseStatus("connected");
            };

            es.onmessage = (e) => {
                try {
                    const notification: Notification = JSON.parse(e.data);

                    setNotifications((prev) => {
                        if (prev.find((n) => n.id === notification.id)) return prev;

                        toast({
                            title: notification.title,
                            description: notification.message,
                        });

                        return [notification, ...prev];
                    });
                } catch {
                    // ignore bad data
                }
            };

            es.onerror = () => {
                if (!isMounted) return;

                setSseStatus("disconnected");
                es.close();

                // retry after 5s
                setTimeout(connectSSE, 5000);
            };
        }

        connectSSE();

        return () => {
            isMounted = false;
            esRef.current?.close();
            setSseStatus("disconnected");
        };
    }, [location.pathname, token]);

    // ─── Actions ──────────────────────────────────────────────────────

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        apiMarkRead(id);
    };

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        apiMarkAllRead();
    };

    const deleteNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        apiDelete(id);
        toast({ title: "Success", description: "Notification removed" });
    };

    const clearAll = () => {
        setNotifications([]);
        apiClearAll();
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        sseStatus,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllRead,
        deleteNotification,
        clearAll,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

// ─── Hook ──────────────────────────────────────────────────────────────

export function useNotifications() {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error("useNotifications must be used within NotificationProvider");
    }

    return context;
}
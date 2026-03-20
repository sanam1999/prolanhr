// src/services/authService.ts
const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3050";

async function post<T>(path: string, body: object): Promise<T> {
    const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.status === 402) {
        console.log(res.status)
        window.location.replace("/unauthorized");
    }
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data as T;
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    accType: "employee" | "admin";
    avatar: string;
    department: string;
}

export interface LoginResponse { message: string; email: string; }
export interface VerifyResponse { message: string; token: string; user: AuthUser; }
export interface MessageResponse { message: string; }

export const authService = {
    /** Step 1 — validate credentials, triggers OTP email */
    login: (email: string, password: string) =>
        post<LoginResponse>("/auth/login", { email, password }),

    /** Step 2 — verify OTP after login */
    verifyOtp: (email: string, otp: string) =>
        post<VerifyResponse>("/auth/verify-otp", { email, otp }),

    /** Forgot password — send reset OTP */
    forgotPassword: (email: string) =>
        post<MessageResponse & { email?: string }>("/auth/forgot-password", { email }),

    /** Reset password — verify OTP + set new password */
    resetPassword: (email: string, otp: string, newPassword: string) =>
        post<MessageResponse>("/auth/reset-password", { email, otp, newPassword }),

    /** Resend OTP for login or reset */
    resendOtp: (email: string, purpose: "login" | "reset") =>
        post<MessageResponse>("/auth/resend-otp", { email, purpose }),
};
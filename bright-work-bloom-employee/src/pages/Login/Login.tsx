import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoginForm from "./LoginForm";
import type { AuthUser } from "../../services/authService";

export default function Login() {
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // If already logged in, go straight to dashboard (or wherever they came from)
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

    useEffect(() => {
        if (isAuthenticated) navigate(from, { replace: true });
    }, [isAuthenticated, navigate, from]);

    const handleAuthSuccess = (token: string, user: AuthUser) => {
        login(token, user);
        navigate(from, { replace: true });
    };

    return <LoginForm onAuthSuccess={handleAuthSuccess} />;
}
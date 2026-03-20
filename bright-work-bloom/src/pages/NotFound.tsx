import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { toast } from "../hooks/use-toast";
import { AppLayout } from "@/components/AppLayout";
import { C } from "../colors/color";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    toast({
      title: "Page Not Found",
      description: "The page you're looking for doesn't exist.",
      variant: "destructive",
    });
  }, [location.pathname]);

  return (

    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", backgroundColor: C.pageBg,
      flexDirection: "column", gap: 20, padding: "20px",
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{
          fontSize: 72, fontWeight: 700, color: C.primary,
          margin: 0, marginBottom: 12,
        }}>404</h1>
        <p style={{
          fontSize: 18, fontWeight: 600, color: C.text,
          marginBottom: 8, margin: 0,
        }}>Oops! Page not found</p>
        <p style={{
          fontSize: 14, color: C.sub, marginBottom: 24, margin: 0,
        }}>The page you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 24px", borderRadius: 12,
            backgroundColor: C.primary, color: "#fff",
            border: "none", fontSize: 14, fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Return to Home
        </button>
      </div>
    </div>

  );
};

export default NotFound;
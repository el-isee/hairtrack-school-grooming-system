import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Scissors } from "lucide-react";
import type { Role } from "@/lib/types";

export function ProtectedRoute({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-primary">
          <Scissors className="h-6 w-6 animate-pulse" />
          <span className="font-medium">Loading…</span>
        </div>
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  if (user.role !== role) return <Navigate to={user.role === "admin" ? "/admin" : "/barber"} />;
  return <>{children}</>;
}

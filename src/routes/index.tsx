import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Scissors } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-primary">
          <Scissors className="h-6 w-6 animate-pulse" />
          <span className="font-medium">Loading HairTrack…</span>
        </div>
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={user.role === "admin" ? "/admin" : "/barber"} />;
}

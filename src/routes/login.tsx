import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Scissors, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import logo from "@/assets/hairtrack-logo.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.displayName || u.email}`);
      navigate({ to: u.role === "admin" ? "/admin" : "/barber" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      toast.error(msg.replace("Firebase: ", ""));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left visual */}
      <div className="hidden lg:flex relative gradient-hero text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="flex items-center gap-3 font-display text-xl font-bold">
          <img src={logo} alt="HairTrack" className="h-12 w-12 rounded-xl bg-white/95 p-1 object-contain shadow-soft" />
          HairTrack
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 max-w-md"
        >
          <h1 className="text-4xl font-bold leading-tight">
            School hair management, made simple.
          </h1>
          <p className="text-white/80">
            Track payments, verify shaves with secret codes, and manage barbers
            with confidence — in real time.
          </p>
          <div className="space-y-3 pt-4">
            <Feature icon={<ShieldCheck className="h-4 w-4" />} text="Fraud-proof verification with secret codes" />
            <Feature icon={<Sparkles className="h-4 w-4" />} text="Real-time dashboards & PDF reports" />
          </div>
        </motion.div>
        <p className="text-xs text-white/60">© {new Date().getFullYear()} HairTrack</p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 font-display text-xl font-bold text-primary mb-8">
            <img src={logo} alt="HairTrack" className="h-12 w-12 rounded-xl object-contain" />
            HairTrack
          </div>
          <h2 className="text-2xl font-bold">Sign in to your account</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Admins and barbers use the same login.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.rw"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-11 gradient-primary text-primary-foreground shadow-soft hover:opacity-95">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">First-time setup</p>
            Create an admin in Firebase Authentication with email{" "}
            <code className="font-mono">admin@hairtrack.app</code> — that account
            will become the admin automatically on first sign-in.
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">← Back to home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="h-7 w-7 rounded-md bg-white/15 flex items-center justify-center">
        {icon}
      </div>
      {text}
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import logo from "@/assets/hairtrack-logo.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await login(email, password);
      toast.success(t("login.welcomeBack", { name: u.displayName || u.email }));
      navigate({ to: u.role === "admin" ? "/admin" : "/barber" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("login.failed");
      toast.error(msg.replace("Firebase: ", ""));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative">
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher />
      </div>
      <div className="hidden lg:flex relative gradient-hero text-primary-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="flex items-center gap-3 font-display text-xl font-bold">
          <img src={logo} alt="HairTrack" className="h-12 w-12 rounded-xl bg-white/95 p-1 object-contain shadow-soft" />
          {t("app.name")}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 max-w-md"
        >
          <h1 className="text-4xl font-bold leading-tight">{t("app.tagline")}</h1>
          <p className="text-white/80">{t("login.description")}</p>
          <div className="space-y-3 pt-4">
            <Feature icon={<ShieldCheck className="h-4 w-4" />} text={t("login.feature1")} />
            <Feature icon={<Sparkles className="h-4 w-4" />} text={t("login.feature2")} />
          </div>
        </motion.div>
        <p className="text-xs text-white/60">© {new Date().getFullYear()} {t("app.name")}</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 font-display text-xl font-bold text-primary mb-8">
            <img src={logo} alt="HairTrack" className="h-12 w-12 rounded-xl object-contain" />
            {t("app.name")}
          </div>
          <h2 className="text-2xl font-bold">{t("login.title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("login.subtitle")}</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.emailPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input
                id="password" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.passwordPlaceholder")}
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full h-11 gradient-primary text-primary-foreground shadow-soft hover:opacity-95">
              {submitting ? t("login.signingIn") : t("login.signIn")}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">{t("login.setupTitle")}</p>
            {t("login.setupText")}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">{t("login.backHome")}</Link>
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

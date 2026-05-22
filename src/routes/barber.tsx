import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import {
  confirmShave, findStudentsByName, subscribeBarberShavings, subscribeClasses,
} from "@/lib/services";
import type { SchoolClass, Shaving, Student } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Scissors, Search, LogOut, ArrowLeft, ShieldCheck, CheckCircle2, XCircle, History,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export const Route = createFileRoute("/barber")({
  component: () => (
    <ProtectedRoute role="barber">
      <BarberPage />
    </ProtectedRoute>
  ),
});

type Step = "search" | "verify" | "done";

function BarberPage() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [code, setCode] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const r = await findStudentsByName(query);
      setResults(r);
      if (r.length === 0) toast.info(t("barberApp.noMatch"));
    } finally { setSearching(false); }
  }

  async function onConfirm() {
    if (!selected || !user) return;
    setConfirming(true);
    try {
      const res = await confirmShave({ student: selected, enteredCode: code, barber: user });
      if (res.ok) {
        toast.success(t("barberApp.confirmed"));
        setStep("done");
      } else {
        toast.error(res.reason);
      }
    } finally { setConfirming(false); }
  }

  function reset() {
    setStep("search"); setQuery(""); setResults([]); setSelected(null); setCode("");
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="bg-card border-b">
        <div className="max-w-2xl mx-auto h-16 flex items-center px-4 gap-3">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
            <Scissors className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-display font-bold leading-none">{t("app.name")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("barberApp.barberLabel", { name: user?.displayName || user?.email })}
            </p>
          </div>
          <LanguageSwitcher />
          <Button size="sm" variant="ghost" onClick={async () => { await logout(); navigate({ to: "/login" }); }}>
            <LogOut className="h-4 w-4 mr-1" /> {t("common.logout")}
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {step === "search" && (
              <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card className="p-5">
                  <h2 className="font-bold text-lg">{t("barberApp.findStudent")}</h2>
                  <p className="text-sm text-muted-foreground mb-4">{t("barberApp.findDesc")}</p>
                  <form onSubmit={search} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input className="pl-9 h-12" placeholder={t("barberApp.typeName")} value={query} onChange={(e) => setQuery(e.target.value)} />
                    </div>
                    <Button type="submit" className="h-12 px-5 gradient-primary text-primary-foreground" disabled={searching}>
                      {searching ? "…" : t("common.search")}
                    </Button>
                  </form>
                </Card>

                {results.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {results.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setSelected(s); setStep("verify"); }}
                        className="w-full text-left bg-card border rounded-2xl p-4 flex items-center gap-3 hover:border-primary hover:shadow-soft transition-all"
                      >
                        {s.photoURL ? (
                          <img src={s.photoURL} className="h-12 w-12 rounded-full object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center font-semibold">
                            {s.fullName.split(" ").slice(0, 2).map((p) => p[0]).join("")}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{s.fullName}</p>
                          <p className="text-xs text-muted-foreground">{s.className}</p>
                        </div>
                        <StatusBadge student={s} />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === "verify" && selected && (
              <motion.div key="verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <button onClick={() => setStep("search")} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center mb-4">
                  <ArrowLeft className="h-4 w-4 mr-1" /> {t("common.back")}
                </button>

                <Card className="p-6 text-center shadow-elevated">
                  {selected.photoURL ? (
                    <img src={selected.photoURL} className="h-32 w-32 mx-auto rounded-full object-cover border-4 border-primary/20" />
                  ) : (
                    <div className="h-32 w-32 mx-auto rounded-full bg-primary/15 text-primary flex items-center justify-center text-4xl font-bold">
                      {selected.fullName.split(" ").slice(0, 2).map((p) => p[0]).join("")}
                    </div>
                  )}
                  <h2 className="mt-4 text-xl font-bold">{selected.fullName}</h2>
                  <p className="text-sm text-muted-foreground">{selected.className}</p>
                  <div className="mt-3 flex justify-center"><StatusBadge student={selected} /></div>

                  {(!selected.paid || selected.remainingCuts <= 0) ? (
                    <div className="mt-5 p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2 justify-center">
                      <XCircle className="h-4 w-4" />
                      {!selected.paid ? t("barberApp.notPaidMsg") : t("barberApp.noShavesMsg")}
                    </div>
                  ) : (
                    <div className="mt-6 space-y-3 text-left">
                      <Label htmlFor="code" className="flex items-center gap-2 text-sm">
                        <ShieldCheck className="h-4 w-4 text-primary" /> {t("barberApp.askCode")}
                      </Label>
                      <Input
                        id="code"
                        autoFocus
                        autoCapitalize="characters"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder={t("barberApp.codePlaceholder")}
                        className="h-14 text-center font-mono text-xl tracking-widest"
                      />
                      <Button
                        onClick={onConfirm}
                        disabled={confirming || !code}
                        className="w-full h-12 gradient-primary text-primary-foreground"
                      >
                        {confirming ? t("barberApp.verifying") : t("barberApp.confirmShave")}
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {step === "done" && selected && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-8 text-center shadow-elevated">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="h-20 w-20 mx-auto rounded-full bg-success/15 text-success flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-10 w-10" />
                  </motion.div>
                  <h2 className="mt-4 text-xl font-bold">{t("barberApp.doneTitle")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("barberApp.remainingLine", { name: selected.fullName, n: selected.remainingCuts - 1 })}
                  </p>
                  <Button className="mt-6 w-full h-12 gradient-primary text-primary-foreground" onClick={reset}>
                    {t("barberApp.nextStudent")}
                  </Button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

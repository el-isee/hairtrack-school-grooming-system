import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Users, DollarSign, Scissors as ScissorsIcon, UserCog, TrendingUp,
} from "lucide-react";
import {
  subscribeShavings, subscribeStudents, subscribeUsers, subscribeSettings,
} from "@/lib/services";
import type { Shaving, Student, AppUser, Settings } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [shavings, setShavings] = useState<Shaving[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const a = subscribeStudents(setStudents);
    const b = subscribeShavings(setShavings);
    const c = subscribeUsers(setUsers);
    const d = subscribeSettings(setSettings);
    return () => { a(); b(); c(); d(); };
  }, []);

  const paid = students.filter((s) => s.paid).length;
  const totalMoney = students.reduce((sum, s) => sum + (s.paymentAmount || 0), 0);
  const activeBarbers = users.filter((u) => u.role === "barber" && !u.disabled).length;

  const daily = useMemo(() => {
    const map = new Map<string, number>();
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      map.set(format(d, "MMM d"), 0);
    }
    shavings.forEach((s) => {
      const key = format(new Date(s.createdAt), "MMM d");
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map, ([day, count]) => ({ day, count }));
  }, [shavings]);

  const byClass = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s) => map.set(s.className, (map.get(s.className) || 0) + 1));
    return Array.from(map, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [students]);

  const recentStudents = students.slice(0, 6);
  const recentShavings = shavings.slice(0, 6);

  const barberPerf = useMemo(() => {
    const map = new Map<string, { name: string; count: number; earnings: number }>();
    shavings.forEach((s) => {
      const cur = map.get(s.barberId) ?? { name: s.barberName, count: 0, earnings: 0 };
      cur.count += 1;
      cur.earnings += s.pricePerShave;
      map.set(s.barberId, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [shavings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Stat title={t("dashboard.totalStudents")} value={students.length} icon={<Users />} />
        <Stat title={t("dashboard.paidStudents")} value={paid} icon={<DollarSign />} tone="success" />
        <Stat title={t("dashboard.moneyCollected")} value={`${totalMoney.toLocaleString()} RWF`} icon={<TrendingUp />} tone="accent" />
        <Stat title={t("dashboard.totalShavings")} value={shavings.length} icon={<ScissorsIcon />} />
        <Stat title={t("dashboard.activeBarbers")} value={activeBarbers} icon={<UserCog />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">{t("dashboard.dailyActivity")}</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis allowDecimals={false} className="text-xs" />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }} />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Students by class</h3>
          <div className="space-y-3">
            {byClass.length === 0 && <EmptyHint label="No classes yet" />}
            {byClass.map((c) => {
              const pct = students.length ? (c.count / students.length) * 100 : 0;
              return (
                <div key={c.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      className="h-full gradient-primary"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">{t("dashboard.recentStudents")}</h3>
          {recentStudents.length === 0 ? (
            <EmptyHint label={t("dashboard.noData")} />
          ) : (
            <div className="space-y-2">
              {recentStudents.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <Avatar name={s.fullName} url={s.photoURL} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.fullName}</p>
                    <p className="text-xs text-muted-foreground">{s.className}</p>
                  </div>
                  <StatusBadge student={s} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">{t("dashboard.recentShavings")}</h3>
          {recentShavings.length === 0 ? (
            <EmptyHint label={t("dashboard.noData")} />
          ) : (
            <div className="space-y-2">
              {recentShavings.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <ScissorsIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.studentName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t("students.barber")}: {s.barberName} · {format(new Date(s.createdAt), "MMM d, HH:mm")}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-success">+{s.pricePerShave} RWF</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-4">{t("dashboard.barberPerformance")}</h3>
        {barberPerf.length === 0 ? (
          <EmptyHint label={t("dashboard.noData")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b">
                  <th className="py-2">{t("barbers.name")}</th>
                  <th className="py-2 text-right">{t("barbers.shavings")}</th>
                  <th className="py-2 text-right">{t("barbers.earnings")}</th>
                </tr>
              </thead>
              <tbody>
                {barberPerf.map((b, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 font-medium">{b.name}</td>
                    <td className="py-3 text-right">{b.count}</td>
                    <td className="py-3 text-right text-success font-medium">{b.earnings.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {settings && (
        <p className="text-xs text-muted-foreground text-center">
          {t("settings.termPayment")}: <b>{settings.termPayment.toLocaleString()} RWF</b> ·
          {" "}{t("settings.allowedCuts")}: <b>{settings.allowedCutsPerTerm}</b> ·
          {" "}{t("settings.pricePerShave")}: <b>{settings.haircutPrice.toLocaleString()} RWF</b>
        </p>
      )}
    </div>
  );
}

function Stat({
  title, value, icon, tone = "primary",
}: {
  title: string; value: string | number; icon: React.ReactNode;
  tone?: "primary" | "success" | "accent";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    accent: "bg-accent/20 text-accent-foreground",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border p-4 shadow-soft"
    >
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold font-display mt-1">{value}</p>
    </motion.div>
  );
}

function Avatar({ name, url }: { name: string; url?: string }) {
  if (url) return <img src={url} alt={name} className="h-9 w-9 rounded-full object-cover" />;
  const initials = name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return (
    <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold">
      {initials}
    </div>
  );
}

function EmptyHint({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground italic">{label}</p>;
}

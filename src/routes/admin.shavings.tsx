import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { subscribeShavings, subscribeClasses, subscribeUsers } from "@/lib/services";
import type { Shaving, SchoolClass, AppUser } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/admin/shavings")({
  component: ShavingsPage,
});

function ShavingsPage() {
  const { t } = useTranslation();
  const [shavings, setShavings] = useState<Shaving[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [barbers, setBarbers] = useState<AppUser[]>([]);
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [barberFilter, setBarberFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const a = subscribeShavings(setShavings);
    const b = subscribeClasses(setClasses);
    const c = subscribeUsers((u) => setBarbers(u.filter((x) => x.role === "barber")));
    return () => { a(); b(); c(); };
  }, []);

  const filtered = useMemo(() => {
    const fromTs = from ? new Date(from).getTime() : 0;
    const toTs = to ? new Date(to).getTime() + 86400000 : Infinity;
    const ql = q.trim().toLowerCase();
    return shavings.filter((s) =>
      (classFilter === "all" || s.className === classFilter) &&
      (barberFilter === "all" || s.barberId === barberFilter) &&
      s.createdAt >= fromTs && s.createdAt <= toTs &&
      (!ql || s.studentName.toLowerCase().includes(ql) || s.barberName.toLowerCase().includes(ql)),
    );
  }, [shavings, q, classFilter, barberFilter, from, to]);

  const total = filtered.reduce((acc, s) => acc + (s.pricePerShave || 0), 0);

  function exportPdf() {
    const doc = new jsPDF();
    doc.text("HairTrack — Shaving Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`${filtered.length} • ${total.toLocaleString()} RWF`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [[t("shavings.date"), t("shavings.student"), t("shavings.class"), t("shavings.barber"), t("shavings.price")]],
      body: filtered.map((s) => [
        format(new Date(s.createdAt), "PPp"),
        s.studentName, s.className, s.barberName, s.pricePerShave,
      ]),
      headStyles: { fillColor: [14, 85, 102] },
    });
    doc.save(`shavings-${Date.now()}.pdf`);
  }

  function reset() {
    setQ(""); setClassFilter("all"); setBarberFilter("all"); setFrom(""); setTo("");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("shavings.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("shavings.recordsTotal", { n: filtered.length, total: total.toLocaleString() })}
          </p>
        </div>
        <Button variant="outline" onClick={exportPdf} disabled={!filtered.length}>{t("common.exportPdf")}</Button>
      </div>

      <Card className="p-4 space-y-3">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t("shavings.searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger><SelectValue placeholder={t("shavings.classPh")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("shavings.allClasses")}</SelectItem>
              {classes.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={barberFilter} onValueChange={setBarberFilter}>
            <SelectTrigger><SelectValue placeholder={t("shavings.barberPh")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("shavings.allBarbers")}</SelectItem>
              {barbers.map((b) => <SelectItem key={b.uid} value={b.uid}>{b.displayName || b.email}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Button variant="ghost" onClick={reset}>{t("common.reset")}</Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">{t("shavings.date")}</th>
                <th className="text-left p-3">{t("shavings.student")}</th>
                <th className="text-left p-3">{t("shavings.class")}</th>
                <th className="text-left p-3">{t("shavings.barber")}</th>
                <th className="text-right p-3">{t("shavings.price")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">{t("shavings.noResults")}</td></tr>
              )}
              {filtered.map((s) => (
                <tr key={s.id} className="border-t hover:bg-muted/30">
                  <td className="p-3">{format(new Date(s.createdAt), "MMM d, yyyy HH:mm")}</td>
                  <td className="p-3 font-medium">{s.studentName}</td>
                  <td className="p-3">{s.className}</td>
                  <td className="p-3">{s.barberName}</td>
                  <td className="p-3 text-right text-success font-medium">+{s.pricePerShave.toLocaleString()} RWF</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

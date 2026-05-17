import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { subscribeShavings } from "@/lib/services";
import type { Shaving } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/admin/shavings")({
  component: ShavingsPage,
});

function ShavingsPage() {
  const [shavings, setShavings] = useState<Shaving[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => subscribeShavings(setShavings), []);

  const filtered = shavings.filter((s) =>
    !q || s.studentName.toLowerCase().includes(q.toLowerCase()) || s.barberName.toLowerCase().includes(q.toLowerCase()),
  );

  function exportPdf() {
    const doc = new jsPDF();
    doc.text("HairTrack — Shaving Report", 14, 16);
    autoTable(doc, {
      startY: 24,
      head: [["Date", "Student", "Class", "Barber", "Price"]],
      body: filtered.map((s) => [
        format(new Date(s.createdAt), "PPp"),
        s.studentName, s.className, s.barberName, s.pricePerShave,
      ]),
      headStyles: { fillColor: [14, 85, 102] },
    });
    doc.save(`shavings-${Date.now()}.pdf`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Shaving history</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} records</p>
        </div>
        <Button variant="outline" onClick={exportPdf} disabled={!filtered.length}>Export PDF</Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by student or barber…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Student</th>
                <th className="text-left p-3">Class</th>
                <th className="text-left p-3">Barber</th>
                <th className="text-right p-3">Price</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No shavings yet</td></tr>
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

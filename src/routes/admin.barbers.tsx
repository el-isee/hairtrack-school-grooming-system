import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { createBarberAccount, subscribeShavings, subscribeUsers } from "@/lib/services";
import type { AppUser, Shaving } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/admin/barbers")({
  component: BarbersPage,
});

function BarbersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [shavings, setShavings] = useState<Shaving[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const a = subscribeUsers(setUsers);
    const b = subscribeShavings(setShavings);
    return () => { a(); b(); };
  }, []);

  const barbers = users.filter((u) => u.role === "barber");

  const stats = useMemo(() => {
    const m = new Map<string, { count: number; earnings: number }>();
    shavings.forEach((s) => {
      const c = m.get(s.barberId) ?? { count: 0, earnings: 0 };
      c.count += 1; c.earnings += s.pricePerShave;
      m.set(s.barberId, c);
    });
    return m;
  }, [shavings]);

  function exportPdf() {
    const doc = new jsPDF();
    doc.text("HairTrack — Barber Report", 14, 16);
    autoTable(doc, {
      startY: 24,
      head: [["Name", "Email", "Shavings", "Earnings (RWF)"]],
      body: barbers.map((b) => {
        const s = stats.get(b.uid) ?? { count: 0, earnings: 0 };
        return [b.displayName || "—", b.email, s.count, s.earnings];
      }),
      headStyles: { fillColor: [14, 85, 102] },
    });
    doc.save(`barbers-${Date.now()}.pdf`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Barbers</h1>
          <p className="text-sm text-muted-foreground">{barbers.length} barber accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPdf} disabled={!barbers.length}>Export PDF</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><UserPlus className="h-4 w-4 mr-1" /> New barber</Button>
            </DialogTrigger>
            <DialogContent>
              <CreateBarberForm onDone={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Email</th>
                <th className="text-right p-3">Shavings</th>
                <th className="text-right p-3">Earnings (RWF)</th>
              </tr>
            </thead>
            <tbody>
              {barbers.length === 0 && (
                <tr><td colSpan={4} className="p-10 text-center text-muted-foreground">No barbers yet</td></tr>
              )}
              {barbers.map((b) => {
                const s = stats.get(b.uid) ?? { count: 0, earnings: 0 };
                return (
                  <tr key={b.uid} className="border-t">
                    <td className="p-3 font-medium">{b.displayName || "—"}</td>
                    <td className="p-3 text-muted-foreground">{b.email}</td>
                    <td className="p-3 text-right">{s.count}</td>
                    <td className="p-3 text-right text-success font-medium">{s.earnings.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CreateBarberForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      setSubmitting(true);
      try {
        await createBarberAccount({ email, password, displayName: name });
        toast.success("Barber account created");
        onDone();
      } catch (err) {
        toast.error((err as Error).message.replace("Firebase: ", ""));
      } finally { setSubmitting(false); }
    }} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create barber account</DialogTitle>
      </DialogHeader>
      <div className="space-y-2">
        <Label>Display name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Password</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create"}</Button>
      </DialogFooter>
    </form>
  );
}

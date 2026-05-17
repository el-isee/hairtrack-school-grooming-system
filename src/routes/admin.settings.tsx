import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "@/lib/services";
import type { Settings } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { getSettings().then(setS); }, []);

  if (!s) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Global settings</h1>
        <p className="text-sm text-muted-foreground">Applies to all new term resets.</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>Term payment (RWF per student)</Label>
          <Input type="number" value={s.termPayment} onChange={(e) => setS({ ...s, termPayment: +e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Allowed cuts per term</Label>
          <Input type="number" value={s.allowedCutsPerTerm} onChange={(e) => setS({ ...s, allowedCutsPerTerm: +e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Price per shave (RWF — barber earning)</Label>
          <Input type="number" value={s.haircutPrice} onChange={(e) => setS({ ...s, haircutPrice: +e.target.value })} />
        </div>
        <Button
          className="gradient-primary text-primary-foreground"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await updateSettings(s);
            toast.success("Settings saved");
            setSaving(false);
          }}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Card>
    </div>
  );
}

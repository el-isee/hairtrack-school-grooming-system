import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { getSettings().then(setS); }, []);

  if (!s) return <p className="text-muted-foreground">{t("common.loading")}</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label>{t("settings.termPayment")}</Label>
          <Input type="number" value={s.termPayment} onChange={(e) => setS({ ...s, termPayment: +e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>{t("settings.allowedCuts")}</Label>
          <Input type="number" value={s.allowedCutsPerTerm} onChange={(e) => setS({ ...s, allowedCutsPerTerm: +e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>{t("settings.pricePerShave")}</Label>
          <Input type="number" value={s.haircutPrice} onChange={(e) => setS({ ...s, haircutPrice: +e.target.value })} />
        </div>
        <Button
          className="gradient-primary text-primary-foreground"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await updateSettings(s);
            toast.success(t("settings.saved"));
            setSaving(false);
          }}
        >
          {saving ? t("common.saving") : t("common.saveChanges")}
        </Button>
      </Card>
    </div>
  );
}

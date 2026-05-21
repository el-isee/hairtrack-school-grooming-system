import { useTranslation } from "react-i18next";
import type { Student } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ student }: { student: Student }) {
  const { t } = useTranslation();
  if (!student.paid) {
    return <Badge tone="gray">{t("status.notPaid")}</Badge>;
  }
  if (student.remainingCuts <= 0) {
    return <Badge tone="red">{t("status.noRemaining")}</Badge>;
  }
  if (student.remainingCuts === 1) {
    return <Badge tone="yellow">{t("status.oneLeft")}</Badge>;
  }
  return <Badge tone="green">{t("status.nLeft", { n: student.remainingCuts })}</Badge>;
}

export function Badge({
  tone,
  children,
}: {
  tone: "green" | "yellow" | "red" | "gray";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    green: "bg-success/15 text-success border-success/30",
    yellow: "bg-warning/20 text-warning-foreground border-warning/40",
    red: "bg-destructive/15 text-destructive border-destructive/30",
    gray: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

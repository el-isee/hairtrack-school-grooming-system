import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const current = i18n.language?.startsWith("rw") ? "rw" : "en";
  return (
    <div className={className} aria-label={t("common.languageLabel")}>
      <Select value={current} onValueChange={(v) => i18n.changeLanguage(v)}>
        <SelectTrigger className="h-8 w-[110px] text-xs">
          <Languages className="h-3.5 w-3.5 mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="rw">Kinyarwanda</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

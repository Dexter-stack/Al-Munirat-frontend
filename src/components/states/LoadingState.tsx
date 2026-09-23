import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function LoadingState({ className, label }: { className?: string; label?: string }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className={cn("flex flex-col items-center justify-center gap-3 py-16 text-slate-500", className)}
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      <p className="text-sm font-medium">{label ?? t("common.loading")}</p>
    </div>
  );
}

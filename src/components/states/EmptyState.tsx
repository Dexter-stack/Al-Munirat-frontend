import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon = "inbox", title, description, action, className }: EmptyStateProps) {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <MaterialIcon name={icon} className="text-2xl" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-900">{title ?? t("states.emptyTitle")}</p>
        <p className="max-w-sm text-sm text-slate-500">{description ?? t("states.emptyDescription")}</p>
      </div>
      {action}
    </div>
  );
}

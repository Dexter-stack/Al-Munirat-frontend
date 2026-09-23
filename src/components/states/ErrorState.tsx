import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/api/client";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  const { t } = useTranslation();
  const isNetwork = error instanceof ApiClientError && error.isNetworkError;
  const message =
    error instanceof ApiClientError && !error.isServerError
      ? error.message
      : isNetwork
        ? t("states.networkErrorDescription")
        : t("states.errorDescription");

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
        <MaterialIcon name="error" className="text-2xl" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-900">{t("states.errorTitle")}</p>
        <p className="max-w-sm text-sm text-slate-500">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <MaterialIcon name="refresh" className="text-base" />
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";

export function PermissionDenied({ homeHref = "/" }: { homeHref?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-500 shadow-sm">
        <MaterialIcon name="lock" className="text-3xl" />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-slate-900">{t("states.permissionDeniedTitle")}</h1>
        <p className="max-w-sm text-sm text-slate-500">{t("states.permissionDeniedDescription")}</p>
      </div>
      <Button asChild>
        <Link to={homeHref}>{t("states.notFoundAction")}</Link>
      </Button>
    </div>
  );
}

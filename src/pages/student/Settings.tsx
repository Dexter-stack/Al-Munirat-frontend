import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentSettingsPage() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700">{t("studentSettings.eyebrow")}</span>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{t("studentSettings.title")}</h1>
      </div>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <MaterialIcon name="translate" className="text-xl" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t("studentSettings.languageTitle")}</h2>
            <p className="text-xs text-slate-500">{t("studentSettings.languageDescription")}</p>
          </div>
        </div>
        <LanguageSwitcher className="mt-4 w-fit" />
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
            <MaterialIcon name="person" className="text-xl" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t("studentSettings.accountTitle")}</h2>
            <p className="text-xs text-slate-500">
              {t("studentSettings.signedInAsPrefix")}{" "}
              <span className="font-semibold text-slate-700">{user?.email}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-rose-100 bg-rose-50/40 p-6 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <MaterialIcon name="logout" className="text-xl" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-slate-900">{t("studentSettings.logoutTitle")}</h2>
            <p className="text-xs text-slate-500">{t("studentSettings.logoutDescription")}</p>
          </div>
          <Button
            variant="outline"
            onClick={logout}
            className="rounded-xl border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100"
          >
            <MaterialIcon name="logout" className="text-base" />
            {t("common.logout")}
          </Button>
        </div>
      </section>
    </div>
  );
}

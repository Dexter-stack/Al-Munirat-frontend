import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/layout/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { MaterialIcon } from "@/components/common/MaterialIcon";

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-100/50 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-slate-100/60 blur-2xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-12">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              {t("nav.home")}
            </Link>
            <Link to="/courses" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              {t("nav.courses")}
            </Link>
            <Link to="/contact" className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              {t("nav.contact")}
            </Link>
          </nav>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="relative z-10 flex w-full flex-1 flex-col justify-center">
        <Outlet />
      </main>

      <footer className="relative z-10 mt-auto border-t border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-12">
          <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-5">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <MaterialIcon name="verified_user" className="text-base text-emerald-600" />
                {t("footer.sslEncrypted")}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <MaterialIcon name="support_agent" className="text-base text-brand-600" />
                {t("footer.helpdesk")}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              © {new Date().getFullYear()} Al-Munirat Academy. {t("footer.rights")}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

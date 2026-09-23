import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/layout/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/about", key: "nav.about" },
  { to: "/courses", key: "nav.courses" },
  { to: "/hajj-umrah", key: "nav.hajjUmrah" },
  { to: "/events", key: "nav.events" },
  { to: "/contact", key: "nav.contact" },
] as const;

export function PublicHeader() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside
        aria-label="Campus announcement"
        className="w-full border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 sm:px-8"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-6 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5 text-brand-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400" />
              Admissions Open
            </span>
            <span className="hidden items-center gap-1 text-slate-400 md:inline-flex">
              <MaterialIcon name="verified" className="text-[15px] text-brand-400" />
              Accredited Sanad Tradition
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-5">
            <Link to="/hajj-umrah" className="flex items-center gap-1 transition-colors hover:text-white">
              <MaterialIcon name="mosque" className="text-[15px] text-amber-400" />
              <span>{t("nav.hajjUmrah")}</span>
            </Link>
            <LanguageSwitcher className="bg-slate-800" />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-slate-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
          <Logo />

          <nav className="hidden items-center gap-1 text-[14px] font-medium text-slate-600 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl px-3.5 py-2 transition-all hover:bg-slate-50 hover:text-slate-900",
                    isActive && "bg-brand-50/60 text-brand-700",
                  )
                }
              >
                {t(item.key)}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2.5 lg:flex">
            <Button asChild variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-700">
              <Link to="/login">
                <MaterialIcon name="school" className="text-base" />
                {t("nav.studentPortal")}
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-xl bg-slate-900 text-white shadow-sm hover:bg-brand-600 hover:shadow-brand-500/20"
            >
              <Link to="/register">
                {t("nav.enrollNow")}
                <MaterialIcon name="arrow_forward" className="text-[15px]" />
              </Link>
            </Button>
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <MaterialIcon name="menu" className="text-2xl" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px]">
              <SheetHeader>
                <SheetTitle>
                  <Logo compact />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "rounded-xl px-3.5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50",
                        isActive && "bg-brand-50/60 text-brand-700",
                      )
                    }
                  >
                    {t(item.key)}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-4 flex flex-col gap-2 px-4">
                <Button asChild variant="outline" onClick={() => setMobileOpen(false)}>
                  <Link to="/login">{t("nav.studentPortal")}</Link>
                </Button>
                <Button asChild onClick={() => setMobileOpen(false)}>
                  <Link to="/register">{t("nav.enrollNow")}</Link>
                </Button>
                <LanguageSwitcher className="mt-2 self-start" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}

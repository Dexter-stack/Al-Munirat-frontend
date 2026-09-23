import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarContent, type DashboardNavSection } from "@/components/layout/DashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardTopbarProps {
  sections: DashboardNavSection[];
  roleLabel: string;
  badge: string;
  backHref: string;
  backLabel: string;
  notificationsHref: string;
  profileHref: string;
  unreadCount?: number;
  searchPlaceholder?: string;
  extra?: ReactNode;
}

export function DashboardTopbar({
  sections,
  roleLabel,
  badge,
  backHref,
  backLabel,
  notificationsHref,
  profileHref,
  unreadCount = 0,
  searchPlaceholder,
  extra,
}: DashboardTopbarProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function initials() {
    if (!user) return "?";
    return `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-md sm:h-18 sm:px-8 lg:ps-8">
      <div className="flex items-center gap-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <MaterialIcon name="menu" className="text-2xl" />
          </Button>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <SidebarContent
              sections={sections}
              user={user}
              roleLabel={roleLabel}
              badge={badge}
              backHref={backHref}
              backLabel={backLabel}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {searchPlaceholder && (
          <div className="relative hidden w-72 lg:block lg:w-80 xl:w-96">
            <MaterialIcon
              name="search"
              className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400"
            />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2 ps-10 pe-4 text-xs text-slate-900 placeholder:text-slate-400 transition-all hover:bg-slate-100/80 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {extra}
        <LanguageSwitcher className="hidden sm:flex" />

        <Button variant="ghost" size="icon" className="relative text-slate-500" asChild>
          <Link to={notificationsHref} aria-label="Notifications">
            <MaterialIcon name="notifications" className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </Link>
        </Button>

        <div className="hidden h-6 w-px bg-slate-200 sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-xl ps-1 transition-colors hover:bg-slate-50">
              <div className="hidden text-end sm:block">
                <p className="text-xs font-bold leading-tight text-slate-900">
                  {user ? `${user.first_name} ${user.last_name}` : ""}
                </p>
                <p className="text-[11px] font-medium text-brand-700">{roleLabel}</p>
              </div>
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover shadow-xs ring-2 ring-brand-500/20"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-xs ring-2 ring-brand-500/20">
                  {initials()}
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to={profileHref}>
                <MaterialIcon name="person" className="text-base" />
                {t("common.view")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} variant="destructive">
              <MaterialIcon name="logout" className="text-base" />
              {t("common.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

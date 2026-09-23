import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import logoImage from "@/assets/logo.jpg";
import { cn } from "@/lib/utils";
import type { User } from "@/types/auth";

export interface DashboardNavItem {
  to: string;
  icon: string;
  label: string;
  end?: boolean;
  badge?: ReactNode;
}

export interface DashboardNavSection {
  heading: string;
  items: DashboardNavItem[];
}

interface SidebarContentProps {
  sections: DashboardNavSection[];
  user: User | null;
  roleLabel: string;
  badge: string;
  backHref: string;
  backLabel: string;
  onNavigate?: () => void;
}

function initials(user: User | null) {
  if (!user) return "?";
  return `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase();
}

export function SidebarContent({
  sections,
  user,
  roleLabel,
  badge,
  backHref,
  backLabel,
  onNavigate,
}: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="p-6">
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
            <img src={logoImage} alt="Al-Munirat Academy" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold leading-none tracking-tight text-slate-900">Al-Munirat</span>
              <span className="rounded-full border border-emerald-200/60 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                {badge}
              </span>
            </div>
            <span dir="rtl" className="mt-1 font-arabic text-xs font-medium text-slate-500">
              أكاديمية المنيرة
            </span>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl border border-sky-100/80 bg-gradient-to-r from-sky-50/70 via-white to-blue-50/40 p-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="h-9 w-9 rounded-xl object-cover ring-2 ring-white shadow-xs"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-xs font-bold text-white ring-2 ring-white shadow-xs">
                  {initials(user)}
                </div>
              )}
              <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-snug text-slate-900">
                {user ? `${user.first_name} ${user.last_name}` : ""}
              </span>
              <span className="text-[11px] font-medium text-brand-700">{roleLabel}</span>
            </div>
          </div>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {sections.map((section) => (
            <div key={section.heading} className="mb-1">
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {section.heading}
              </div>
              <div className="flex flex-col gap-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                        isActive
                          ? "bg-brand-600 text-white shadow-sm shadow-brand-500/25"
                          : "text-slate-600 hover:bg-sky-50/70 hover:text-brand-700",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <MaterialIcon
                          name={item.icon}
                          className={cn(
                            "text-[20px] transition-colors",
                            isActive ? "text-white" : "text-slate-400 group-hover:text-brand-600",
                          )}
                        />
                        <span>{item.label}</span>
                        {item.badge && <span className="ms-auto">{item.badge}</span>}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/50 p-5">
        <Link
          to={backHref}
          className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white p-3 text-slate-600 shadow-2xs transition-all hover:border-brand-200 hover:text-brand-700"
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            <MaterialIcon name="arrow_back" className="text-sm text-brand-600" />
            <span>{backLabel}</span>
          </div>
          <MaterialIcon name="launch" className="text-sm text-slate-400" />
        </Link>
      </div>
    </div>
  );
}

export function DashboardSidebar(props: SidebarContentProps) {
  return (
    <aside className="fixed start-0 top-0 z-50 hidden h-full w-72 flex-col justify-between border-e border-slate-200/80 bg-white/95 shadow-[2px_0_24px_rgba(15,23,42,0.02)] backdrop-blur-xl lg:flex">
      <SidebarContent {...props} />
    </aside>
  );
}

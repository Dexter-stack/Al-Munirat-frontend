import { Link } from "react-router-dom";
import logoImage from "@/assets/logo.jpg";
import { cn } from "@/lib/utils";

interface LogoProps {
  to?: string;
  className?: string;
  compact?: boolean;
}

export function Logo({ to = "/", className, compact }: LogoProps) {
  return (
    <Link to={to} className={cn("group flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition-transform group-hover:scale-105">
        <img src={logoImage} alt="Al-Munirat Academy" className="h-full w-full object-contain" />
      </div>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="flex items-center gap-1.5 text-lg font-extrabold tracking-tight text-slate-900">
            Al-Munirat
            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
              Academy
            </span>
          </span>
          <span dir="rtl" className="mt-0.5 font-arabic text-xs font-semibold text-slate-500">
            أكاديمية المنيرة
          </span>
        </div>
      )}
    </Link>
  );
}

import { MaterialIcon } from "@/components/common/MaterialIcon";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: string;
  value: string;
  label: string;
  tone?: "sky" | "emerald" | "amber" | "brand" | "rose";
  highlight?: boolean;
}

const TONES = {
  sky: "bg-sky-50 border-sky-100 text-brand-700",
  emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
  amber: "bg-amber-50 border-amber-100 text-amber-600",
  brand: "bg-brand-600 border-brand-600 text-white",
  rose: "bg-rose-50 border-rose-100 text-rose-600",
} as const;

export function StatCard({ icon, value, label, tone = "sky", highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xs",
        highlight && "border-brand-200/70 ring-2 ring-brand-100/50",
      )}
    >
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border", TONES[tone])}>
        <MaterialIcon name={icon} className="text-xl" />
      </div>
      <div>
        <div className={cn("text-xl font-bold leading-tight", highlight ? "text-brand-700" : "text-slate-900")}>
          {value}
        </div>
        <div className="mt-0.5 text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

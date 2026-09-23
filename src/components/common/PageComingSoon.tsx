import { MaterialIcon } from "@/components/common/MaterialIcon";

/**
 * Placeholder for a route that exists in the IA but hasn't been built out
 * yet. Never used for a feature that's "done" — swap for the real page
 * before considering that phase complete (mock-data policy).
 */
export function PageComingSoon({ title, icon = "construction" }: { title: string; icon?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <MaterialIcon name={icon} className="text-2xl" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
        <p className="max-w-sm text-sm text-slate-500">This screen is under active development.</p>
      </div>
    </div>
  );
}

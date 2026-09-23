import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { QueryState } from "@/components/states/QueryState";
import { studentResultsApi } from "@/api/student";
import { cn } from "@/lib/utils";

export default function StudentResultsPage() {
  const { t } = useTranslation();
  const resultsQuery = useQuery({ queryKey: ["student", "results"], queryFn: studentResultsApi.list });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700">{t("studentResults.eyebrow")}</span>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{t("studentResults.title")}</h1>
      </div>

      <QueryState
        isLoading={resultsQuery.isLoading}
        error={resultsQuery.error}
        data={resultsQuery.data}
        onRetry={() => resultsQuery.refetch()}
        isEmpty={(d) => d.length === 0}
        emptyProps={{
          icon: "military_tech",
          title: t("studentResults.emptyTitle"),
          description: t("studentResults.emptyDescription"),
        }}
      >
        {(results) => (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {results.map((r) => (
              <div key={r.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        r.passed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600",
                      )}
                    >
                      <MaterialIcon name="workspace_premium" className="text-xl" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{r.course.title}</p>
                      <h3 className="text-sm font-bold text-slate-900">{r.exam.title}</h3>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                      r.passed ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
                    )}
                  >
                    {r.passed ? t("studentResults.passed") : t("studentResults.failed")}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      {r.score}/{r.total_marks}
                    </p>
                    <p className="text-[11px] text-slate-500">{t("studentResults.score")}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{r.percentage}%</p>
                    <p className="text-[11px] text-slate-500">{t("studentResults.percentage")}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">{r.grade}</p>
                    <p className="text-[11px] text-slate-500">{t("studentResults.grade")}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400">{t("studentResults.takenOn", { date: new Date(r.taken_at).toLocaleDateString() })}</p>
              </div>
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}

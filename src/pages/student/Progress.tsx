import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { Progress } from "@/components/ui/progress";
import { QueryState } from "@/components/states/QueryState";
import { studentProgressApi } from "@/api/student";

export default function StudentProgressPage() {
  const { t } = useTranslation();
  const progressQuery = useQuery({ queryKey: ["student", "progress"], queryFn: studentProgressApi.overview });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700">{t("studentProgress.eyebrow")}</span>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{t("studentProgress.title")}</h1>
      </div>

      <QueryState
        isLoading={progressQuery.isLoading}
        error={progressQuery.error}
        data={progressQuery.data}
        onRetry={() => progressQuery.refetch()}
        isEmpty={(d) => d.courses.length === 0}
        emptyProps={{ icon: "trending_up", title: t("studentProgress.emptyTitle"), description: t("studentProgress.emptyDescription") }}
      >
        {(data) => (
          <>
            <section className="flex flex-col items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xs sm:flex-row sm:justify-center sm:gap-10">
              <ProgressRing value={data.overall_percent} size={140} label={t("studentProgress.overallLabel")} />
              <div className="text-center sm:text-left">
                <h2 className="text-lg font-bold text-slate-900">{t("studentProgress.overallCompletionTitle")}</h2>
                <p className="mt-1 max-w-xs text-sm text-slate-500">
                  {t("studentProgress.overallCompletionDescription")}
                </p>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {data.courses.map((cp) => (
                <div key={cp.course.id} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-brand-600">
                      {cp.course.cover_image_url ? (
                        <img src={cp.course.cover_image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <MaterialIcon name="menu_book" className="text-lg" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{cp.course.title}</p>
                      <p className="text-xs text-slate-500">{t("studentProgress.completePercent", { percent: cp.completion_percent })}</p>
                    </div>
                  </div>
                  <Progress value={cp.completion_percent} className="mt-3 h-2" />

                  <div className="mt-4 space-y-3">
                    <MetricBar
                      icon="menu_book"
                      label={t("studentProgress.lessons")}
                      completed={cp.lessons_completed}
                      total={cp.lessons_total}
                    />
                    <MetricBar
                      icon="assignment"
                      label={t("studentProgress.assignments")}
                      completed={cp.assignments_completed}
                      total={cp.assignments_total}
                    />
                    <MetricBar icon="quiz" label={t("studentProgress.tests")} completed={cp.tests_completed} total={cp.tests_total} />
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                    <span className="text-slate-500">{t("studentProgress.averageScore")}</span>
                    <span className="font-bold text-slate-900">{cp.average_score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </QueryState>
    </div>
  );
}

function MetricBar({ icon, label, completed, total }: { icon: string; label: string; completed: number; total: number }) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-slate-600">
          <MaterialIcon name={icon} className="text-sm text-brand-600" />
          {label}
        </span>
        <span className="text-slate-500">
          {completed}/{total}
        </span>
      </div>
      <Progress value={percent} className="mt-1 h-1.5" />
    </div>
  );
}

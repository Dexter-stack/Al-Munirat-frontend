import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { QueryState } from "@/components/states/QueryState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { studentAssignmentsApi, studentCoursesApi } from "@/api/student";
import type { SubmissionStatus } from "@/types/academic";
import { SUBMISSION_STATUS_STYLES } from "@/lib/assignmentStatus";

const STATUS_OPTIONS: SubmissionStatus[] = ["not_started", "submitted", "late", "graded"];

const SUBMISSION_STATUS_I18N_KEY: Record<SubmissionStatus, string> = {
  not_started: "studentAssignments.statusNotStarted",
  submitted: "studentAssignments.statusSubmitted",
  late: "studentAssignments.statusLate",
  graded: "studentAssignments.statusGraded",
};

export default function StudentAssignmentsPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const courseFilter = searchParams.get("course");
  const [status, setStatus] = useState<SubmissionStatus | "all">("all");

  const assignmentsQuery = useQuery({
    queryKey: ["student", "assignments", { course_id: courseFilter }],
    queryFn: () =>
      studentAssignmentsApi.list({
        course_id: courseFilter ?? undefined,
        per_page: 24,
      }),
  });

  // Assignment only carries course_id (API_DOCUMENTATION.md §10) — resolve names client-side.
  const coursesQuery = useQuery({
    queryKey: ["student", "courses", "all"],
    queryFn: () => studentCoursesApi.list({ per_page: 100 }),
  });
  const courseNameById = new Map((coursesQuery.data?.items ?? []).map((c) => [c.id, c.name]));

  // submission_status is per-student and computed by the backend — filter client-side
  // since the API doesn't expose it as a query param (it isn't a stored column).
  const filteredItems = (assignmentsQuery.data?.items ?? []).filter(
    (a) => status === "all" || (a.submission_status ?? "not_started") === status,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-700">{t("studentAssignments.eyebrow")}</span>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{t("studentAssignments.title")}</h1>
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as SubmissionStatus | "all")}>
          <SelectTrigger className="h-11 w-full rounded-xl border-slate-200/90 bg-white sm:w-52">
            <SelectValue placeholder={t("studentAssignments.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("studentAssignments.allStatuses")}</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {t(SUBMISSION_STATUS_I18N_KEY[s])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QueryState
        isLoading={assignmentsQuery.isLoading}
        error={assignmentsQuery.error}
        data={assignmentsQuery.data}
        onRetry={() => assignmentsQuery.refetch()}
        isEmpty={() => filteredItems.length === 0}
        emptyProps={{
          icon: "assignment",
          title: t("studentAssignments.emptyTitle"),
          description: t("studentAssignments.emptyDescription"),
        }}
      >
        {() => (
          <div className="flex flex-col gap-3">
            {filteredItems.map((a) => {
              const submissionStatus = a.submission_status ?? "not_started";
              const style = SUBMISSION_STATUS_STYLES[submissionStatus];
              const isOverdue = submissionStatus === "not_started" && a.due_date && new Date(a.due_date) < new Date();
              return (
                <Link
                  key={a.id}
                  to={`/student/assignments/${a.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-colors hover:border-brand-200 hover:bg-sky-50/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <MaterialIcon name="assignment" className="text-lg" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{a.title}</p>
                      <p className="text-xs text-slate-500">
                        {a.course_id && (courseNameById.get(a.course_id) ?? "—")}
                        {" • "}
                        {t("studentAssignments.due", { date: a.due_date ? new Date(a.due_date).toLocaleDateString() : "—" })}
                        {isOverdue && <span className="ml-1 font-semibold text-rose-600">{t("studentAssignments.overdue")}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-center">
                    {submissionStatus === "graded" && a.submission && typeof a.submission.score === "number" && (
                      <span className="text-xs font-bold text-slate-700">
                        {a.submission.score}/{a.maximum_score}
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${style.badge}`}>
                      {t(SUBMISSION_STATUS_I18N_KEY[submissionStatus])}
                    </span>
                    <MaterialIcon name="chevron_right" className="hidden text-slate-400 sm:block" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </QueryState>
    </div>
  );
}

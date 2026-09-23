import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { QueryState } from "@/components/states/QueryState";
import { studentCoursesApi, studentExamsApi } from "@/api/student";
import { cn } from "@/lib/utils";
import type { ExamAvailability } from "@/types/exam";

const STATUS_STYLES: Record<ExamAvailability, string> = {
  upcoming: "bg-slate-100 text-slate-600",
  open: "bg-emerald-50 text-emerald-700",
  closed: "bg-rose-50 text-rose-700",
};

const STATUS_I18N_KEY: Record<ExamAvailability, string> = {
  upcoming: "studentExams.statusUpcoming",
  open: "studentExams.statusAvailable",
  closed: "studentExams.statusClosed",
};

const LANGUAGE_I18N_KEY: Record<string, string> = {
  english: "studentExamDetail.languageEnglish",
  arabic: "studentExamDetail.languageArabic",
  both: "studentExamDetail.languageBoth",
};

export default function StudentExamsPage() {
  const { t } = useTranslation();
  const examsQuery = useQuery({ queryKey: ["student", "exams"], queryFn: () => studentExamsApi.list({ per_page: 100 }) });
  const coursesQuery = useQuery({
    queryKey: ["student", "courses", "picker"],
    queryFn: () => studentCoursesApi.list({ per_page: 100 }),
  });
  const courseNameById = new Map((coursesQuery.data?.items ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700">{t("studentExams.eyebrow")}</span>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{t("studentExams.title")}</h1>
      </div>

      <QueryState
        isLoading={examsQuery.isLoading}
        error={examsQuery.error}
        data={examsQuery.data}
        onRetry={() => examsQuery.refetch()}
        isEmpty={(d) => d.items.length === 0}
        emptyProps={{ icon: "quiz", title: t("studentExams.emptyTitle"), description: t("studentExams.emptyDescription") }}
      >
        {(data) => (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map((exam) => (
              <Link
                key={exam.id}
                to={`/student/exams/${exam.id}`}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <MaterialIcon name="quiz" className="text-xl" />
                  </div>
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold capitalize", STATUS_STYLES[exam.availability])}>
                    {t(STATUS_I18N_KEY[exam.availability])}
                  </span>
                </div>
                <div>
                  {exam.course_id && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                      {courseNameById.get(exam.course_id) ?? "—"}
                    </p>
                  )}
                  <h3 className="mt-0.5 text-sm font-bold text-slate-900">{exam.title}</h3>
                  {exam.arabic_title && (
                    <p dir="rtl" className="mt-0.5 font-arabic text-xs text-slate-500">
                      {exam.arabic_title}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <MaterialIcon name="timer" className="text-sm" />
                    {exam.duration_minutes} {t("studentExams.minutesSuffix")}
                  </span>
                  <span className="flex items-center gap-1">
                    <MaterialIcon name="translate" className="text-sm" />
                    {LANGUAGE_I18N_KEY[exam.language] ? t(LANGUAGE_I18N_KEY[exam.language]) : exam.language}
                  </span>
                  {Boolean(exam.attempts_used) && (
                    <span className="ml-auto flex items-center gap-1 font-semibold text-emerald-600">
                      <MaterialIcon name="check_circle" className="text-sm" />
                      {t("studentExams.attempted")}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}

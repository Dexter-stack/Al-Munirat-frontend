import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { studentCoursesApi, studentExamsApi } from "@/api/student";

const EXAM_LANGUAGE_I18N_KEY: Record<string, string> = {
  english: "studentExamDetail.languageEnglish",
  arabic: "studentExamDetail.languageArabic",
  both: "studentExamDetail.languageBoth",
};

export default function StudentExamDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const examId = Number(id);
  const navigate = useNavigate();

  const examQuery = useQuery({
    queryKey: ["student", "exams", examId],
    queryFn: () => studentExamsApi.get(examId),
    enabled: Number.isFinite(examId),
  });

  const courseId = examQuery.data?.course_id ?? undefined;
  const courseQuery = useQuery({
    queryKey: ["student", "courses", courseId],
    queryFn: () => studentCoursesApi.get(courseId!),
    enabled: Boolean(courseId),
  });

  if (examQuery.isLoading) return <LoadingState />;
  if (examQuery.error) return <ErrorState error={examQuery.error} onRetry={() => examQuery.refetch()} />;
  if (!examQuery.data) return null;

  const exam = examQuery.data;
  const attemptsUsed = exam.attempts_used ?? 0;
  const canStart = exam.availability === "open" && attemptsUsed < exam.max_attempts;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link to="/student/exams" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">
        <MaterialIcon name="arrow_back" className="text-base" />
        {t("studentExamDetail.backToExams")}
      </Link>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <MaterialIcon name="quiz" className="text-2xl" />
          </div>
          <div>
            {courseQuery.data && (
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{courseQuery.data.name}</p>
            )}
            <h1 className="text-xl font-bold text-slate-900">{exam.title}</h1>
            {exam.arabic_title && (
              <p dir="rtl" className="mt-0.5 font-arabic text-sm text-slate-500">
                {exam.arabic_title}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InfoTile icon="timer" label={t("studentExamDetail.durationLabel")} value={`${exam.duration_minutes} ${t("studentExams.minutesSuffix")}`} />
          <InfoTile icon="quiz" label={t("studentExamDetail.questionsLabel")} value={`${exam.question_count}`} />
          <InfoTile
            icon="workspace_premium"
            label={t("studentExamDetail.passMarkLabel")}
            value={t("studentExamTake.marksSuffix", { count: Number(exam.pass_mark) })}
          />
          <InfoTile
            icon="translate"
            label={t("studentExamDetail.languageLabel")}
            value={EXAM_LANGUAGE_I18N_KEY[exam.language] ? t(EXAM_LANGUAGE_I18N_KEY[exam.language]) : exam.language}
          />
        </div>

        <div className="mt-6 space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <p className="flex items-start gap-2">
            <MaterialIcon name="info" className="mt-0.5 shrink-0 text-sm" />
            {t("studentExamDetail.noticeStable")}
          </p>
          <p className="flex items-start gap-2">
            <MaterialIcon name="lock" className="mt-0.5 shrink-0 text-sm" />
            {t("studentExamDetail.noticeAutosave")}
          </p>
        </div>

        <Button
          disabled={!canStart}
          onClick={() => navigate(`/student/exams/${examId}/take`)}
          className="mt-6 h-12 w-full rounded-xl text-sm font-bold"
        >
          {t("studentExamDetail.startExam")}
          <MaterialIcon name="arrow_forward" className="text-lg" />
        </Button>
        {!canStart && (
          <p className="mt-2 text-center text-xs text-slate-500">
            {exam.availability === "upcoming"
              ? t("studentExamDetail.notOpenYet")
              : exam.availability === "closed"
                ? t("studentExamDetail.closedMessage")
                : t("studentExamDetail.attemptsExhausted")}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5 text-center">
      <MaterialIcon name={icon} className="mx-auto text-lg text-brand-600" />
      <p className="mt-1.5 text-sm font-bold capitalize text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

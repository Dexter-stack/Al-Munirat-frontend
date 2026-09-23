import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { QueryState } from "@/components/states/QueryState";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminExamAttemptsApi } from "@/api/admin/examAttempts";
import { adminExamsApi } from "@/api/admin/exams";
import { cn } from "@/lib/utils";
import type { ExamAttempt } from "@/types/exam";

export default function AdminExamAttemptsPage() {
  const { t } = useTranslation();
  const { examId: examIdParam } = useParams<{ examId: string }>();
  const examId = Number(examIdParam);
  const [reviewing, setReviewing] = useState<ExamAttempt | null>(null);

  const examQuery = useQuery({
    queryKey: ["admin", "exams", examId],
    queryFn: () => adminExamsApi.get(examId),
    enabled: Number.isFinite(examId),
  });

  const attemptsQuery = useQuery({
    queryKey: ["admin", "exams", examId, "attempts"],
    queryFn: () => adminExamAttemptsApi.list(examId),
    enabled: Number.isFinite(examId),
  });

  return (
    <div className="flex flex-col gap-6">
      <Link to="/admin/exams" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">
        <MaterialIcon name="arrow_back" className="text-base" />
        {t("adminExamAttempts.backToExams")}
      </Link>

      <AdminPageHeader
        title={t("adminExamAttempts.title")}
        description={t("adminExamAttempts.subtitle", { title: examQuery.data?.title ?? "" })}
      />

      <QueryState
        isLoading={attemptsQuery.isLoading}
        error={attemptsQuery.error}
        data={attemptsQuery.data}
        onRetry={() => attemptsQuery.refetch()}
        isEmpty={(d) => d.length === 0}
        emptyProps={{
          icon: "fact_check",
          title: t("adminExamAttempts.emptyTitle"),
          description: t("adminExamAttempts.emptyDescription"),
        }}
      >
        {(attempts) => (
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminExamAttempts.colStudent")}</TableHead>
                    <TableHead>{t("adminExamAttempts.colStatus")}</TableHead>
                    <TableHead>{t("adminExamAttempts.colScore")}</TableHead>
                    <TableHead>{t("adminExamAttempts.colStarted")}</TableHead>
                    <TableHead>{t("adminExamAttempts.colSubmitted")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell>
                        <p className="font-semibold text-slate-900">
                          {attempt.user ? `${attempt.user.first_name} ${attempt.user.last_name}` : `#${attempt.user_id}`}
                        </p>
                        <p className="text-xs text-slate-500">{attempt.user?.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            attempt.status === "submitted"
                              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                              : "border-brand-100 bg-brand-50 text-brand-700"
                          }
                        >
                          {attempt.status === "submitted"
                            ? t("adminExamAttempts.statusSubmitted")
                            : t("adminExamAttempts.statusInProgress")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {attempt.status === "submitted" ? (
                          <span className={cn("font-semibold", attempt.passed ? "text-emerald-700" : "text-rose-700")}>
                            {Number(attempt.score)}/{Number(attempt.total_marks)} ({Math.round(Number(attempt.percentage))}%) ·{" "}
                            {attempt.passed ? t("adminExamAttempts.passed") : t("adminExamAttempts.failed")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">{new Date(attempt.started_at).toLocaleString()}</TableCell>
                      <TableCell className="text-slate-600">
                        {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : t("adminExamAttempts.notSubmittedYet")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setReviewing(attempt)}>
                          <MaterialIcon name="visibility" className="text-base" />
                          {t("adminExamAttempts.review")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </QueryState>

      <AttemptReviewDialog
        examId={examId}
        attempt={reviewing}
        onOpenChange={(open) => !open && setReviewing(null)}
      />
    </div>
  );
}

function AttemptReviewDialog({
  examId,
  attempt,
  onOpenChange,
}: {
  examId: number;
  attempt: ExamAttempt | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const reviewQuery = useQuery({
    queryKey: ["admin", "exams", examId, "attempts", attempt?.id, "review"],
    queryFn: () => adminExamAttemptsApi.get(examId, attempt!.id),
    enabled: Boolean(attempt),
  });

  return (
    <Dialog open={Boolean(attempt)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("adminExamAttempts.reviewDialogTitle")}</DialogTitle>
          {attempt && (
            <DialogDescription>
              {t("adminExamAttempts.reviewDialogDescription", {
                name: attempt.user ? `${attempt.user.first_name} ${attempt.user.last_name}` : `#${attempt.user_id}`,
                score: Number(attempt.score ?? 0),
                total: Number(attempt.total_marks ?? 0),
                percentage: Math.round(Number(attempt.percentage ?? 0)),
              })}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto">
          {reviewQuery.isLoading && <LoadingState />}
          {reviewQuery.error && <ErrorState error={reviewQuery.error} onRetry={() => reviewQuery.refetch()} />}
          {reviewQuery.data?.questions.map((q, i) => (
            <div key={q.id} className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {i + 1}. {q.question_text}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((option) => {
                  const isCorrect = option.is_correct;
                  const wasSelected = q.selected_option_ids.includes(option.id);
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-3 py-2 text-sm",
                        isCorrect && "border-emerald-300 bg-emerald-50 text-emerald-800",
                        !isCorrect && wasSelected && "border-rose-300 bg-rose-50 text-rose-800",
                        !isCorrect && !wasSelected && "border-slate-200 text-slate-600",
                      )}
                    >
                      <span>{option.option_text}</span>
                      <span className="flex items-center gap-2 text-xs font-semibold">
                        {wasSelected && (
                          <span className="flex items-center gap-1">
                            <MaterialIcon name="person" className="text-sm" />
                            {t("adminExamAttempts.studentSelectedLabel")}
                          </span>
                        )}
                        {isCorrect && (
                          <span className="flex items-center gap-1">
                            <MaterialIcon name="check_circle" className="text-sm" />
                            {t("adminExamAttempts.correctAnswerLabel")}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
                {q.selected_option_ids.length === 0 && (
                  <p className="text-xs italic text-slate-400">{t("adminExamAttempts.noAnswerGiven")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

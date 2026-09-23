import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { studentExamsApi } from "@/api/student";
import { useServerCountdown } from "@/hooks/useServerCountdown";
import { ApiClientError } from "@/api/client";
import { cn } from "@/lib/utils";
import type { ExamQuestion } from "@/types/exam";

type AnswerMap = Record<number, number[]>;

export default function StudentExamTakePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const examId = Number(id);
  const navigate = useNavigate();

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [serverTime, setServerTime] = useState<string | null>(null);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [examTitle, setExamTitle] = useState("");
  const [examLanguage, setExamLanguage] = useState<"english" | "arabic" | "both">("english");

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submittingRef = useRef(false);
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const startMutation = useMutation({
    // Idempotent per API_CONTRACT.md §9: if an attempt is already in
    // progress, the backend is expected to return that attempt rather
    // than create a second one.
    mutationFn: () => studentExamsApi.start(examId),
    onSuccess: (res) => {
      setAttemptId(res.attempt.id);
      setQuestions(res.questions);
      setServerTime(res.server_time);
      setEndsAt(res.attempt.ends_at);
      setVisited(new Set([res.questions[0]?.id].filter(Boolean) as number[]));
      // Resume support: reflect any answers already saved server-side.
      const seeded: AnswerMap = {};
      res.questions.forEach((q) => {
        if (q.selected_option_ids.length) seeded[q.id] = q.selected_option_ids;
      });
      setAnswers(seeded);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("studentExamTake.toastStartError"));
    },
  });

  const examMetaQuery = useQuery({
    queryKey: ["student", "exams", examId, "meta"],
    queryFn: () => studentExamsApi.get(examId),
    enabled: Number.isFinite(examId),
  });

  useEffect(() => {
    if (examMetaQuery.data) {
      setExamTitle(examMetaQuery.data.title);
      setExamLanguage(examMetaQuery.data.language);
    }
  }, [examMetaQuery.data]);

  useEffect(() => {
    if (Number.isFinite(examId) && !attemptId && !startMutation.isPending && !startMutation.isError) {
      startMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  const saveAnswersMutation = useMutation({
    mutationFn: (payload: { question_id: number; selected_option_ids: number[] }[]) =>
      studentExamsApi.saveAnswers(examId, attemptId as number, { answers: payload }),
  });

  const submitMutation = useMutation({
    mutationFn: () => studentExamsApi.submit(examId, attemptId as number),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("studentExamTake.toastSubmitError"));
      submittingRef.current = false;
    },
  });

  const handleSubmit = useCallback(() => {
    if (submittingRef.current || !attemptId) return;
    submittingRef.current = true;
    setConfirmOpen(false);
    submitMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const { remainingMs, label: timerLabel } = useServerCountdown(serverTime, endsAt, handleSubmit);

  // Warn before an accidental tab close while an attempt is live.
  useEffect(() => {
    if (!attemptId || submitted) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [attemptId, submitted]);

  function persistAnswer(questionId: number, optionIds: number[]) {
    if (!attemptId) return;
    clearTimeout(saveTimers.current[questionId]);
    saveTimers.current[questionId] = setTimeout(() => {
      saveAnswersMutation.mutate([{ question_id: questionId, selected_option_ids: optionIds }]);
    }, 400);
  }

  function selectSingle(question: ExamQuestion, optionId: number) {
    setAnswers((prev) => {
      const next = { ...prev, [question.id]: [optionId] };
      persistAnswer(question.id, [optionId]);
      return next;
    });
  }

  function toggleMultiple(question: ExamQuestion, optionId: number) {
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      const next = current.includes(optionId) ? current.filter((o) => o !== optionId) : [...current, optionId];
      const updated = { ...prev, [question.id]: next };
      persistAnswer(question.id, next);
      return updated;
    });
  }

  function goTo(index: number) {
    if (index < 0 || index >= questions.length) return;
    setCurrentIndex(index);
    setVisited((prev) => new Set(prev).add(questions[index].id));
  }

  function toggleFlag(questionId: number) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  const isRtl = examLanguage === "arabic";
  const answeredCount = Object.values(answers).filter((v) => v.length > 0).length;
  const currentQuestion = questions[currentIndex];
  const isLowTime = remainingMs !== null && remainingMs < 5 * 60 * 1000;

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
            <MaterialIcon name="check_circle" className="text-3xl" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">{t("studentExamTake.examSubmittedTitle")}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {t("studentExamTake.examSubmittedBody")}
          </p>
          <Button onClick={() => navigate("/student/results")} className="mt-6 h-11 w-full rounded-xl">
            {t("studentExamTake.viewResults")}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/student")}
            className="mt-2 h-11 w-full rounded-xl"
          >
            {t("studentExamTake.backToDashboard")}
          </Button>
        </div>
      </div>
    );
  }

  if (startMutation.isPending || !attemptId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        {startMutation.isError ? (
          <ErrorState error={startMutation.error} onRetry={() => startMutation.mutate()} />
        ) : (
          <LoadingState label={t("studentExamTake.preparingExam")} />
        )}
      </div>
    );
  }

  if (!currentQuestion) return null;

  const selected = answers[currentQuestion.id] ?? [];
  const isMultiple = currentQuestion.type === "multiple_answer";

  return (
    // Only the Arabic question/option text below switches direction
    // (each has its own `dir="rtl"`) — the chrome (timer, palette, buttons)
    // stays in the app's own direction so numeric counters and controls
    // never get bidi-reordered regardless of the exam's language.
    <div className="min-h-screen bg-slate-50">
      <header className="flex flex-col gap-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 px-5 py-4 text-white md:flex-row md:items-center md:justify-between md:px-7">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-sky-300 backdrop-blur-md">
            <MaterialIcon name="school" className="text-xl" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">{t("studentExamTake.examinationLabel")}</p>
            <h1 className="text-base font-bold tracking-tight text-white">{examTitle}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md",
              isLowTime && "border-rose-400/50 bg-rose-500/20",
            )}
          >
            <span className="relative flex h-3 w-3">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                  isLowTime ? "bg-rose-400" : "bg-emerald-400",
                )}
              />
              <span className={cn("relative inline-flex h-3 w-3 rounded-full", isLowTime ? "bg-rose-400" : "bg-emerald-400")} />
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase leading-none tracking-wider text-slate-300">
                {t("studentExamTake.timeRemaining")}
              </span>
              <span className="mt-0.5 font-mono text-base font-extrabold tracking-wider text-white">{timerLabel}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 divide-y divide-slate-100 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        {/* Question body */}
        <div className="flex flex-col justify-between bg-white p-5 sm:p-7 lg:col-span-8">
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="rounded-xl border border-brand-200/60 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                  {t("studentExamTake.questionOf", { current: currentIndex + 1, total: questions.length })}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {isMultiple ? t("studentExamTake.multipleAnswer") : t("studentExamTake.singleChoice")} •{" "}
                  {t("studentExamTake.marksSuffix", { count: Number(currentQuestion.marks) })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleFlag(currentQuestion.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                  flagged.has(currentQuestion.id)
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-700",
                )}
              >
                <MaterialIcon name={flagged.has(currentQuestion.id) ? "bookmark" : "bookmark_border"} className="text-base" />
                {flagged.has(currentQuestion.id) ? t("studentExamTake.flagged") : t("studentExamTake.flagForReview")}
              </button>
            </div>

            <div className="mb-6 rounded-2xl border border-sky-100/70 bg-gradient-to-b from-sky-50/30 to-slate-50/50 p-6">
              <p
                dir={isRtl ? "rtl" : "ltr"}
                className={cn("text-slate-900", isRtl ? "font-arabic text-xl font-bold leading-relaxed md:text-2xl" : "text-sm font-medium leading-relaxed md:text-base")}
              >
                {isRtl
                  ? currentQuestion.arabic_question_text || currentQuestion.question_text
                  : currentQuestion.question_text}
              </p>
              {!isRtl && currentQuestion.arabic_question_text && (
                <p dir="rtl" className="mt-3 font-arabic text-lg text-slate-600">
                  {currentQuestion.arabic_question_text}
                </p>
              )}
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, i) => {
                const isSelected = selected.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all",
                      isSelected
                        ? "border-2 border-brand-600 bg-sky-50/60 shadow-xs"
                        : "border-slate-200 hover:border-brand-300 hover:bg-sky-50/30",
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <input
                        type={isMultiple ? "checkbox" : "radio"}
                        name={`question-${currentQuestion.id}`}
                        checked={isSelected}
                        onChange={() =>
                          isMultiple ? toggleMultiple(currentQuestion, option.id) : selectSingle(currentQuestion, option.id)
                        }
                        className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <div className={cn("text-xs font-bold", isSelected ? "text-brand-700" : "text-slate-400")}>
                          {t("studentExamTake.optionLabel", { letter: String.fromCharCode(65 + i) })}
                        </div>
                        <div className={cn("text-sm", isSelected ? "font-bold text-slate-900" : "font-medium text-slate-800")}>
                          {option.option_text}
                        </div>
                      </div>
                    </div>
                    {option.arabic_option_text && (
                      <span dir="rtl" className="font-arabic text-lg text-slate-500">
                        {option.arabic_option_text}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
            <Button
              variant="outline"
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="rounded-xl text-xs font-semibold"
            >
              <MaterialIcon name="arrow_back" className="text-base" />
              {t("common.previous")}
            </Button>
            <div className="flex items-center gap-2.5">
              {currentIndex < questions.length - 1 ? (
                <Button onClick={() => goTo(currentIndex + 1)} className="rounded-xl bg-slate-900 text-xs font-semibold hover:bg-slate-800">
                  {t("common.next")}
                  <MaterialIcon name="arrow_forward" className="text-base" />
                </Button>
              ) : null}
              <Button
                onClick={() => setConfirmOpen(true)}
                className="rounded-xl bg-emerald-600 text-xs font-semibold shadow-sm shadow-emerald-600/20 hover:bg-emerald-700"
              >
                <MaterialIcon name="check_circle" className="text-base" />
                {t("studentExamTake.submitExam")}
              </Button>
            </div>
          </div>
        </div>

        {/* Palette */}
        <div className="flex flex-col justify-between bg-slate-50/60 p-6 lg:col-span-4">
          <div>
            <div className="mb-3 flex items-center justify-between border-b border-slate-200/70 pb-3">
              <h3 className="text-sm font-bold text-slate-900">{t("studentExamTake.questionPalette")}</h3>
              <span className="rounded-full border border-brand-200/60 bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                {t("studentExamTake.answeredCount", { answered: answeredCount, total: questions.length })}
              </span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 text-[11px] font-medium text-slate-600">
              <Legend swatch="bg-emerald-600 text-white" label={t("studentExamTake.legendAnswered")} />
              <Legend swatch="bg-brand-600 text-white" label={t("studentExamTake.legendCurrent")} />
              <Legend swatch="border border-amber-300 bg-amber-100 text-amber-700" label={t("studentExamTake.legendFlagged")} />
              <Legend swatch="border border-slate-200 bg-white text-slate-400" label={t("studentExamTake.legendUnvisited")} />
            </div>

            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-6">
              {questions.map((q, i) => {
                const isAnswered = (answers[q.id]?.length ?? 0) > 0;
                const isFlaggedQ = flagged.has(q.id);
                const isCurrent = i === currentIndex;
                const isVisited = visited.has(q.id);
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => goTo(i)}
                    className={cn(
                      "flex h-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors",
                      isCurrent && "bg-brand-600 text-white shadow-sm ring-2 ring-brand-300",
                      !isCurrent && isAnswered && "bg-emerald-600 text-white hover:opacity-90",
                      !isCurrent && !isAnswered && isFlaggedQ && "border border-amber-300 bg-amber-100 text-amber-800",
                      !isCurrent && !isAnswered && !isFlaggedQ && isVisited && "border border-slate-300 bg-white text-slate-600",
                      !isCurrent && !isAnswered && !isFlaggedQ && !isVisited && "border border-slate-200 bg-white text-slate-400",
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-3">
            <MaterialIcon name="shield" className="mt-0.5 shrink-0 text-lg text-emerald-600" />
            <div>
              <p className="text-[11px] font-bold leading-snug text-slate-900">{t("studentExamTake.honorCodeTitle")}</p>
              <p className="mt-0.5 text-[10px] leading-tight text-slate-500">
                {t("studentExamTake.honorCodeBody")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("studentExamTake.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("studentExamTake.confirmDescriptionAnswered", { answered: answeredCount, total: questions.length })}
              {questions.length - answeredCount > 0
                ? t("studentExamTake.confirmRemaining", { remaining: questions.length - answeredCount })
                : t("studentExamTake.confirmFullStop")}{" "}
              {t("studentExamTake.confirmCannotUndo")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="rounded-xl">
              {t("studentExamTake.keepReviewing")}
            </Button>
            <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
              {submitMutation.isPending ? t("common.submitting") : t("studentExamTake.submitExam")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded-md text-[9px] font-bold", swatch)} />
      <span>{label}</span>
    </div>
  );
}

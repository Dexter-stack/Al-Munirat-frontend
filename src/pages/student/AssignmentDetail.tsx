import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { studentAssignmentsApi, studentCoursesApi } from "@/api/student";
import { ApiClientError } from "@/api/client";
import { SUBMISSION_STATUS_STYLES } from "@/lib/assignmentStatus";
import { cn } from "@/lib/utils";
import type { SubmissionStatus } from "@/types/academic";

const SUBMISSION_STATUS_I18N_KEY: Record<SubmissionStatus, string> = {
  not_started: "studentAssignments.statusNotStarted",
  submitted: "studentAssignments.statusSubmitted",
  late: "studentAssignments.statusLate",
  graded: "studentAssignments.statusGraded",
};

export default function StudentAssignmentDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const assignmentId = Number(id);
  const queryClient = useQueryClient();

  const [files, setFiles] = useState<File[]>([]);
  const [openingAttachmentId, setOpeningAttachmentId] = useState<number | null>(null);

  const assignmentQuery = useQuery({
    queryKey: ["student", "assignments", assignmentId],
    queryFn: () => studentAssignmentsApi.get(assignmentId),
    enabled: Number.isFinite(assignmentId),
  });

  const coursesQuery = useQuery({
    queryKey: ["student", "courses", "all"],
    queryFn: () => studentCoursesApi.list({ per_page: 100 }),
  });

  const submitMutation = useMutation({
    mutationFn: () => studentAssignmentsApi.submit(assignmentId, files),
    onSuccess: () => {
      toast.success(t("studentAssignmentDetail.toastSuccess"));
      queryClient.invalidateQueries({ queryKey: ["student", "assignments"] });
      setFiles([]);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("studentAssignmentDetail.toastError"));
    },
  });

  async function openAttachment(attachmentId: number) {
    setOpeningAttachmentId(attachmentId);
    try {
      const blobUrl = await studentAssignmentsApi.downloadAttachmentBlobUrl(assignmentId, attachmentId);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : t("studentAssignmentDetail.toastOpenError"));
    } finally {
      setOpeningAttachmentId(null);
    }
  }

  if (assignmentQuery.isLoading) return <LoadingState />;
  if (assignmentQuery.error) return <ErrorState error={assignmentQuery.error} onRetry={() => assignmentQuery.refetch()} />;
  if (!assignmentQuery.data) return null;

  const a = assignmentQuery.data;
  const submissionStatus = a.submission_status ?? "not_started";
  const style = SUBMISSION_STATUS_STYLES[submissionStatus];
  const isLocked = submissionStatus === "graded" || a.status === "closed";
  const courseName = a.course_id
    ? (coursesQuery.data?.items.find((c) => c.id === a.course_id)?.name ?? null)
    : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link
        to="/student/assignments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
      >
        <MaterialIcon name="arrow_back" className="text-base" />
        {t("studentAssignmentDetail.backToAssignments")}
      </Link>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <MaterialIcon name="assignment" className="text-2xl" />
            </div>
            <div>
              {courseName && <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{courseName}</p>}
              <h1 className="text-xl font-bold text-slate-900">{a.title}</h1>
              {a.arabic_title && (
                <p dir="rtl" className="mt-0.5 font-arabic text-sm text-slate-500">
                  {a.arabic_title}
                </p>
              )}
            </div>
          </div>
          <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize", style.badge)}>
            {t(SUBMISSION_STATUS_I18N_KEY[submissionStatus])}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoTile icon="event" label={t("studentAssignmentDetail.dueTile")} value={a.due_date ? new Date(a.due_date).toLocaleDateString() : t("studentAssignmentDetail.noDueDate")} />
          <InfoTile icon="workspace_premium" label={t("studentAssignmentDetail.maxScoreTile")} value={a.maximum_score} />
          {submissionStatus === "graded" && a.submission && typeof a.submission.score === "number" && (
            <InfoTile icon="grade" label={t("studentAssignmentDetail.yourScoreTile")} value={`${a.submission.score}/${a.maximum_score}`} />
          )}
        </div>

        {a.description && (
          <div className="mt-6 space-y-2">
            <h2 className="text-sm font-bold text-slate-900">{t("studentAssignmentDetail.descriptionTitle")}</h2>
            <p className="text-sm leading-relaxed text-slate-600">{a.description}</p>
          </div>
        )}

        {a.attachments.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <h2 className="text-sm font-bold text-slate-900">{t("studentAssignmentDetail.instructionsFilesTitle")}</h2>
            {a.attachments.map((att) => (
              <button
                key={att.id}
                type="button"
                disabled={openingAttachmentId === att.id}
                onClick={() => openAttachment(att.id)}
                className="flex w-full items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-brand-700 hover:bg-slate-50"
              >
                <MaterialIcon name="attach_file" className="text-sm" />
                {openingAttachmentId === att.id ? t("studentAssignmentDetail.opening") : att.original_filename}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 border-t border-slate-100 pt-6">
          {a.submission && (
            <div className="mb-4 space-y-3">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-2xl border p-4 text-sm",
                  submissionStatus === "graded"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                <MaterialIcon name="task_alt" className="text-lg" />
                <span>
                  {t("studentAssignmentDetail.submitted", { date: new Date(a.submission.submitted_at).toLocaleString() })}
                  {submissionStatus === "graded" ? t("studentAssignmentDetail.gradedSuffix") : t("studentAssignmentDetail.awaitingGradingSuffix")}
                </span>
              </div>
              {a.submission.attachments.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("studentAssignmentDetail.yourSubmittedFilesTitle")}</p>
                  {a.submission.attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MaterialIcon name="description" className="text-sm text-slate-400" />
                      {att.original_filename}
                    </div>
                  ))}
                </div>
              )}
              {a.submission.feedback && (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("studentAssignmentDetail.teacherFeedbackTitle")}</p>
                  <p className="mt-1 text-sm text-slate-700">{a.submission.feedback}</p>
                </div>
              )}
            </div>
          )}

          {isLocked ? (
            a.status === "closed" && !a.submission ? (
              <p className="text-sm text-slate-500">{t("studentAssignmentDetail.closedNoSubmission")}</p>
            ) : submissionStatus === "graded" ? (
              <p className="text-sm text-slate-500">{t("studentAssignmentDetail.gradedLocked")}</p>
            ) : null
          ) : (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                {a.submission ? t("studentAssignmentDetail.resubmitTitle") : t("studentAssignmentDetail.submitTitle")}
              </h2>
              <label
                htmlFor="attachments"
                className="group flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/20"
              >
                <MaterialIcon
                  name="cloud_upload"
                  className="text-3xl text-brand-600 transition-transform group-hover:scale-110"
                />
                <span className="text-xs font-bold text-slate-800">
                  {files.length > 0
                    ? t("studentAssignmentDetail.uploadFilesSelected", { count: files.length })
                    : t("studentAssignmentDetail.uploadPrompt")}
                </span>
                <span className="text-[11px] text-slate-400">{t("studentAssignmentDetail.uploadHint")}</span>
                <input
                  id="attachments"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                />
              </label>
              <Button
                type="button"
                disabled={files.length === 0 || submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
                className="h-12 w-full rounded-xl text-sm font-bold"
              >
                {submitMutation.isPending
                  ? t("common.submitting")
                  : a.submission
                    ? t("studentAssignmentDetail.resubmitButton")
                    : t("studentAssignmentDetail.submitButton")}
                <MaterialIcon name="send" className="text-lg" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5 text-center">
      <MaterialIcon name={icon} className="mx-auto text-lg text-brand-600" />
      <p className="mt-1.5 text-sm font-bold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

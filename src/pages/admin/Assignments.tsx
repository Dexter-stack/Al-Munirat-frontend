import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { QueryState } from "@/components/states/QueryState";
import { EmptyState } from "@/components/states/EmptyState";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminAssignmentsApi } from "@/api/admin/assignments";
import { adminCoursesApi } from "@/api/admin/courses";
import { ApiClientError } from "@/api/client";
import type { Assignment, AssignmentSubmission } from "@/types/academic";
import { ASSIGNMENT_LIFECYCLE_STYLES, SUBMISSION_STATUS_STYLES } from "@/lib/assignmentStatus";

function buildAssignmentSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().min(1, t("adminAssignments.titleRequired")),
    arabic_title: z.string().optional(),
    description: z.string().optional(),
    course_id: z.string().optional(),
    due_date: z.string().optional(),
    maximum_score: z.number().min(1, t("adminAssignments.maxScoreError")),
  });
}

type AssignmentFormValues = z.infer<ReturnType<typeof buildAssignmentSchema>>;

const EMPTY_VALUES: AssignmentFormValues = {
  title: "",
  arabic_title: "",
  description: "",
  course_id: "",
  due_date: "",
  maximum_score: 100,
};

function toDatetimeLocalValue(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AdminAssignmentsPage() {
  const { t } = useTranslation();
  const assignmentSchema = useMemo(() => buildAssignmentSchema(t), [t]);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const assignmentsQuery = useQuery({
    queryKey: ["admin", "assignments", { page }],
    queryFn: () => adminAssignmentsApi.list({ page }),
  });

  const coursesQuery = useQuery({
    queryKey: ["admin", "courses", "picker"],
    queryFn: () => adminCoursesApi.list({ per_page: 100 }),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: EMPTY_VALUES,
  });

  function openCreate() {
    setEditing(null);
    reset(EMPTY_VALUES);
    setSheetOpen(true);
  }

  function openEdit(assignment: Assignment) {
    setEditing(assignment);
    reset({
      title: assignment.title,
      arabic_title: assignment.arabic_title ?? "",
      description: assignment.description ?? "",
      course_id: assignment.course_id ? String(assignment.course_id) : "",
      due_date: toDatetimeLocalValue(assignment.due_date),
      maximum_score: Number(assignment.maximum_score),
    });
    setSheetOpen(true);
  }

  const createMutation = useMutation({
    mutationFn: (values: AssignmentFormValues) =>
      adminAssignmentsApi.create({
        title: values.title,
        arabic_title: values.arabic_title || undefined,
        description: values.description || undefined,
        course_id: values.course_id ? Number(values.course_id) : null,
        due_date: values.due_date || undefined,
        maximum_score: values.maximum_score,
      }),
    onSuccess: () => {
      toast.success(t("adminAssignments.toastCreated"));
      queryClient.invalidateQueries({ queryKey: ["admin", "assignments"] });
      setSheetOpen(false);
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminAssignments.toastCreateError")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: AssignmentFormValues }) =>
      adminAssignmentsApi.update(id, {
        title: values.title,
        arabic_title: values.arabic_title || undefined,
        description: values.description || undefined,
        course_id: values.course_id ? Number(values.course_id) : null,
        due_date: values.due_date || undefined,
        maximum_score: values.maximum_score,
      }),
    onSuccess: () => {
      toast.success(t("adminAssignments.toastUpdated"));
      queryClient.invalidateQueries({ queryKey: ["admin", "assignments"] });
      setSheetOpen(false);
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminAssignments.toastUpdateError")),
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => adminAssignmentsApi.publish(id),
    onSuccess: () => {
      toast.success(t("adminAssignments.toastPublished"));
      queryClient.invalidateQueries({ queryKey: ["admin", "assignments"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminAssignments.toastPublishError")),
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => adminAssignmentsApi.close(id),
    onSuccess: () => {
      toast.success(t("adminAssignments.toastClosed"));
      queryClient.invalidateQueries({ queryKey: ["admin", "assignments"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminAssignments.toastCloseError")),
  });

  function onSubmit(values: AssignmentFormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, values });
    } else {
      createMutation.mutate(values);
    }
  }

  const courseOptions = useMemo(() => coursesQuery.data?.items ?? [], [coursesQuery.data]);
  const courseNameById = useMemo(() => new Map(courseOptions.map((c) => [c.id, c.name])), [courseOptions]);
  const isSaving = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("adminAssignments.title")}
        description={t("adminAssignments.subtitle")}
        action={
          <Button onClick={openCreate}>
            <MaterialIcon name="add" className="text-base" />
            {t("adminAssignments.createAssignment")}
          </Button>
        }
      />

      <QueryState
        isLoading={assignmentsQuery.isLoading}
        error={assignmentsQuery.error}
        data={assignmentsQuery.data}
        onRetry={() => assignmentsQuery.refetch()}
        isEmpty={(d) => d.items.length === 0}
        emptyProps={{
          icon: "assignment",
          title: t("adminAssignments.emptyTitle"),
          description: t("adminAssignments.emptyDescription"),
        }}
      >
        {(data) => (
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminAssignments.colTitle")}</TableHead>
                    <TableHead>{t("adminAssignments.colCourse")}</TableHead>
                    <TableHead>{t("adminAssignments.colDue")}</TableHead>
                    <TableHead>{t("adminAssignments.colMaxScore")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((assignment) => {
                    const meta = ASSIGNMENT_LIFECYCLE_STYLES[assignment.status];
                    const statusLabelKey =
                      assignment.status === "published"
                        ? "adminAssignments.statusPublished"
                        : assignment.status === "closed"
                          ? "adminAssignments.statusClosed"
                          : "adminAssignments.statusDraft";
                    const isExpanded = expandedId === assignment.id;
                    return (
                      <Fragment key={assignment.id}>
                        <TableRow>
                          <TableCell className="max-w-[240px]">
                            <p className="truncate font-semibold text-slate-900">{assignment.title}</p>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {assignment.course_id ? (courseNameById.get(assignment.course_id) ?? "—") : t("adminAssignments.allClasses")}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : t("adminAssignments.noDueDate")}
                          </TableCell>
                          <TableCell className="text-slate-600">{assignment.maximum_score}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={meta.badge}>
                              {t(statusLabelKey)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setExpandedId(isExpanded ? null : assignment.id)}
                              >
                                <MaterialIcon name="folder_shared" className="text-base" />
                                {t("adminAssignments.submissionsButton")}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon-sm">
                                    <MaterialIcon name="more_vert" className="text-lg" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEdit(assignment)}>
                                    <MaterialIcon name="edit" className="text-base" />
                                    {t("common.edit")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => publishMutation.mutate(assignment.id)}
                                    disabled={assignment.status === "published"}
                                  >
                                    <MaterialIcon name="publish" className="text-base" />
                                    {t("common.publish")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => closeMutation.mutate(assignment.id)}
                                    disabled={assignment.status === "closed"}
                                  >
                                    <MaterialIcon name="lock" className="text-base" />
                                    {t("adminAssignments.closeAction")}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={6} className="whitespace-normal bg-slate-50/60 p-4">
                              <SubmissionsPanel assignment={assignment} />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <AdminPagination meta={data.meta} onPageChange={setPage} />
          </div>
        )}
      </QueryState>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? t("adminAssignments.sheetTitleEdit") : t("adminAssignments.sheetTitleCreate")}</SheetTitle>
            <SheetDescription>
              {editing ? t("adminAssignments.sheetDescEdit") : t("adminAssignments.sheetDescCreate")}
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-4 overflow-y-auto px-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="title">{t("adminAssignments.fieldTitle")}</Label>
              <Input id="title" {...register("title")} aria-invalid={Boolean(errors.title)} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="arabic_title">{t("adminAssignments.fieldArabicTitle")}</Label>
              <Input id="arabic_title" dir="rtl" className="font-arabic" {...register("arabic_title")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">{t("adminAssignments.fieldDescription")}</Label>
              <Textarea id="description" rows={4} {...register("description")} />
            </div>

            <div className="space-y-1.5">
              <Label>{t("adminAssignments.fieldCourseOptional")}</Label>
              <Controller
                control={control}
                name="course_id"
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("adminAssignments.selectCoursePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("adminShared.unrestricted")}</SelectItem>
                      {courseOptions.map((course) => (
                        <SelectItem key={course.id} value={String(course.id)}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="due_date">{t("adminAssignments.fieldDueDate")}</Label>
                <Input id="due_date" type="datetime-local" {...register("due_date")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maximum_score">{t("adminAssignments.fieldMaxScore")}</Label>
                <Input
                  id="maximum_score"
                  type="number"
                  min={1}
                  {...register("maximum_score", { valueAsNumber: true })}
                  aria-invalid={Boolean(errors.maximum_score)}
                />
                {errors.maximum_score && <p className="text-xs text-destructive">{errors.maximum_score.message}</p>}
              </div>
            </div>

            <SheetFooter className="mt-auto px-0">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("common.saving") : editing ? t("adminShared.saveChanges") : t("adminAssignments.createAssignmentBtn")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                {t("common.cancel")}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SubmissionsPanel({ assignment }: { assignment: Assignment }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Not paginated on the backend — a class roster, not an open-ended list (API_DOCUMENTATION.md §10).
  const submissionsQuery = useQuery({
    queryKey: ["admin", "assignments", assignment.id, "submissions"],
    queryFn: () => adminAssignmentsApi.submissions(assignment.id),
  });

  const gradeMutation = useMutation({
    mutationFn: ({
      submissionId,
      score,
      feedback,
    }: {
      submissionId: number;
      score: number;
      feedback?: string;
    }) => adminAssignmentsApi.grade(assignment.id, submissionId, { score, feedback }),
    onSuccess: () => {
      toast.success(t("adminAssignments.toastGraded"));
      queryClient.invalidateQueries({
        queryKey: ["admin", "assignments", assignment.id, "submissions"],
      });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminAssignments.toastGradeError")),
  });

  if (submissionsQuery.isLoading) return <LoadingState />;
  if (submissionsQuery.error) return <ErrorState error={submissionsQuery.error} onRetry={() => submissionsQuery.refetch()} />;
  if (!submissionsQuery.data || submissionsQuery.data.length === 0) {
    return (
      <EmptyState
        icon="inbox"
        title={t("adminAssignments.submissionsEmptyTitle")}
        description={t("adminAssignments.submissionsEmptyDesc")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {submissionsQuery.data.map((submission) => (
        <SubmissionRow
          key={submission.id}
          assignmentId={assignment.id}
          submission={submission}
          maxScore={Number(assignment.maximum_score)}
          isSaving={gradeMutation.isPending}
          onGrade={(score, feedback) => gradeMutation.mutate({ submissionId: submission.id, score, feedback })}
        />
      ))}
    </div>
  );
}

function SubmissionRow({
  assignmentId,
  submission,
  maxScore,
  isSaving,
  onGrade,
}: {
  assignmentId: number;
  submission: AssignmentSubmission;
  maxScore: number;
  isSaving: boolean;
  onGrade: (score: number, feedback?: string) => void;
}) {
  const { t } = useTranslation();
  const [score, setScore] = useState(submission.score != null ? String(submission.score) : "");
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [openingAttachmentId, setOpeningAttachmentId] = useState<number | null>(null);
  const meta = SUBMISSION_STATUS_STYLES[submission.status];

  async function openAttachment(attachmentId: number) {
    setOpeningAttachmentId(attachmentId);
    try {
      const blobUrl = await adminAssignmentsApi.downloadSubmissionAttachmentBlobUrl(assignmentId, submission.id, attachmentId);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : t("adminAssignments.toastAttachmentError"));
    } finally {
      setOpeningAttachmentId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {submission.user
              ? `${submission.user.first_name} ${submission.user.last_name}`
              : t("adminAssignments.submissionLabel", { id: submission.id })}
          </p>
          <p className="text-xs text-slate-500">
            {t("adminAssignments.submittedAt", { date: new Date(submission.submitted_at).toLocaleString() })}
          </p>
        </div>
        <Badge variant="outline" className={meta.badge}>
          {meta.label}
        </Badge>
      </div>

      {submission.attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {submission.attachments.map((att) => (
            <button
              key={att.id}
              type="button"
              disabled={openingAttachmentId === att.id}
              onClick={() => openAttachment(att.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-slate-50"
            >
              <MaterialIcon name="attach_file" className="text-sm" />
              {openingAttachmentId === att.id ? t("adminAssignments.openingAttachment") : att.original_filename}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[100px_1fr_auto] sm:items-end">
        <div className="space-y-1">
          <Label className="text-xs">{t("adminAssignments.scoreLabel", { max: maxScore })}</Label>
          <Input
            type="number"
            min={0}
            max={maxScore}
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t("adminAssignments.feedbackLabel")}</Label>
          <Textarea rows={1} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
        <Button
          size="sm"
          disabled={isSaving || score === ""}
          onClick={() => onGrade(Number(score), feedback || undefined)}
        >
          {t("adminAssignments.gradeButton")}
        </Button>
      </div>
    </div>
  );
}

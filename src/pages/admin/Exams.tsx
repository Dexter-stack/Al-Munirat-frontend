import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { adminExamsApi } from "@/api/admin/exams";
import { adminCoursesApi } from "@/api/admin/courses";
import { adminClassesApi } from "@/api/admin/classes";
import { ApiClientError } from "@/api/client";
import type { ContentLanguage } from "@/types/academic";
import type { Exam, ExamStatus } from "@/types/exam";

const LANGUAGES: ContentLanguage[] = ["english", "arabic", "both"];

const LANGUAGE_META: Record<ContentLanguage, { labelKey: string; className: string }> = {
  english: { labelKey: "adminShared.languageEnglish", className: "border-brand-100 bg-brand-50 text-brand-700" },
  arabic: { labelKey: "adminShared.languageArabic", className: "border-amber-100 bg-amber-50 text-amber-700" },
  both: { labelKey: "adminShared.languageBilingual", className: "border-emerald-100 bg-emerald-50 text-emerald-700" },
};

const STATUS_META: Record<ExamStatus, { labelKey: string; className: string }> = {
  draft: { labelKey: "adminShared.statusContent.draft", className: "border-slate-200 bg-slate-100 text-slate-600" },
  published: { labelKey: "adminShared.statusContent.published", className: "border-emerald-100 bg-emerald-50 text-emerald-700" },
  closed: { labelKey: "adminShared.statusContent.closed", className: "border-rose-100 bg-rose-50 text-rose-700" },
};

function buildExamSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().min(1, t("adminExams.titleRequired")),
    arabic_title: z.string().optional(),
    description: z.string().optional(),
    course_id: z.string().optional(),
    class_id: z.string().optional(),
    language: z.enum(["english", "arabic", "both"]),
    duration_minutes: z.number().min(1, t("adminExams.durationError")),
    pass_mark: z.number().min(0, t("adminExams.passMarkError")),
    max_attempts: z.number().min(1, t("adminExams.maxAttemptsError")),
    status: z.enum(["draft", "published", "closed"]),
    starts_at: z.string().optional(),
    ends_at: z.string().optional(),
  });
}

type ExamFormValues = z.infer<ReturnType<typeof buildExamSchema>>;

const EMPTY_VALUES: ExamFormValues = {
  title: "",
  arabic_title: "",
  description: "",
  course_id: "",
  class_id: "",
  language: "english",
  duration_minutes: 60,
  pass_mark: 50,
  max_attempts: 1,
  status: "draft",
  starts_at: "",
  ends_at: "",
};

function toDatetimeLocalValue(iso?: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AdminExamsPage() {
  const { t } = useTranslation();
  const examSchema = useMemo(() => buildExamSchema(t), [t]);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);

  const examsQuery = useQuery({
    queryKey: ["admin", "exams", { page }],
    queryFn: () => adminExamsApi.list({ page }),
  });

  const coursesQuery = useQuery({
    queryKey: ["admin", "courses", "picker"],
    queryFn: () => adminCoursesApi.list({ per_page: 100 }),
  });

  const classesQuery = useQuery({
    queryKey: ["admin", "classes", "picker"],
    queryFn: () => adminClassesApi.list({ per_page: 100 }),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: EMPTY_VALUES,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "exams"] });
  }

  function openCreate() {
    setEditing(null);
    reset(EMPTY_VALUES);
    setSheetOpen(true);
  }

  function openEdit(exam: Exam) {
    setEditing(exam);
    reset({
      title: exam.title,
      arabic_title: exam.arabic_title ?? "",
      description: exam.description ?? "",
      course_id: exam.course_id ? String(exam.course_id) : "",
      class_id: exam.class_id ? String(exam.class_id) : "",
      language: exam.language,
      duration_minutes: exam.duration_minutes,
      pass_mark: Number(exam.pass_mark),
      max_attempts: exam.max_attempts,
      status: exam.status,
      starts_at: toDatetimeLocalValue(exam.starts_at),
      ends_at: toDatetimeLocalValue(exam.ends_at),
    });
    setSheetOpen(true);
  }

  function payloadFrom(values: ExamFormValues) {
    return {
      title: values.title,
      arabic_title: values.arabic_title || undefined,
      description: values.description || undefined,
      course_id: values.course_id ? Number(values.course_id) : null,
      class_id: values.class_id ? Number(values.class_id) : null,
      language: values.language,
      duration_minutes: values.duration_minutes,
      pass_mark: values.pass_mark,
      max_attempts: values.max_attempts,
      status: values.status,
      starts_at: values.starts_at || undefined,
      ends_at: values.ends_at || undefined,
    };
  }

  const createMutation = useMutation({
    mutationFn: (values: ExamFormValues) => adminExamsApi.create(payloadFrom(values)),
    onSuccess: () => {
      toast.success(t("adminExams.toastCreated"));
      invalidate();
      setSheetOpen(false);
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminExams.toastCreateError")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: ExamFormValues }) => adminExamsApi.update(id, payloadFrom(values)),
    onSuccess: () => {
      toast.success(t("adminExams.toastUpdated"));
      invalidate();
      setSheetOpen(false);
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminExams.toastUpdateError")),
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => adminExamsApi.publish(id),
    onSuccess: () => {
      toast.success(t("adminExams.toastPublished"));
      invalidate();
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminExams.toastPublishError")),
  });

  const closeMutation = useMutation({
    mutationFn: (id: number) => adminExamsApi.close(id),
    onSuccess: () => {
      toast.success(t("adminExams.toastClosed"));
      invalidate();
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminExams.toastCloseError")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminExamsApi.remove(id),
    onSuccess: () => {
      toast.success(t("adminExams.toastDeleted"));
      invalidate();
      setDeleteTarget(null);
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminExams.toastDeleteError")),
  });

  function onSubmit(values: ExamFormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, values });
    } else {
      createMutation.mutate(values);
    }
  }

  const courseOptions = useMemo(() => coursesQuery.data?.items ?? [], [coursesQuery.data]);
  const classOptions = useMemo(() => classesQuery.data?.items ?? [], [classesQuery.data]);
  const courseNameById = useMemo(() => new Map(courseOptions.map((c) => [c.id, c.name])), [courseOptions]);
  const isSaving = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("adminExams.title")}
        description={t("adminExams.subtitle")}
        action={
          <Button onClick={openCreate}>
            <MaterialIcon name="add" className="text-base" />
            {t("adminExams.createExam")}
          </Button>
        }
      />

      <QueryState
        isLoading={examsQuery.isLoading}
        error={examsQuery.error}
        data={examsQuery.data}
        onRetry={() => examsQuery.refetch()}
        isEmpty={(d) => d.items.length === 0}
        emptyProps={{ icon: "quiz", title: t("adminExams.emptyTitle"), description: t("adminExams.emptyDescription") }}
      >
        {(data) => (
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminExams.colTitle")}</TableHead>
                    <TableHead>{t("adminExams.colCourse")}</TableHead>
                    <TableHead>{t("adminExams.colLanguage")}</TableHead>
                    <TableHead>{t("adminExams.colDuration")}</TableHead>
                    <TableHead>{t("adminExams.colPassMark")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((exam) => {
                    const langMeta = LANGUAGE_META[exam.language];
                    const statusMeta = STATUS_META[exam.status];
                    return (
                      <TableRow key={exam.id}>
                        <TableCell className="max-w-[220px]">
                          <p className="truncate font-semibold text-slate-900">{exam.title}</p>
                          <p className="text-xs text-slate-500">
                            {t("adminExams.questionsMeta", { count: exam.question_count })}
                          </p>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {exam.course_id ? (courseNameById.get(exam.course_id) ?? "—") : t("adminExams.allClasses")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={langMeta.className}>
                            {t(langMeta.labelKey)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">{t("adminExams.durationMinutes", { count: exam.duration_minutes })}</TableCell>
                        <TableCell className="text-slate-600">{Number(exam.pass_mark)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusMeta.className}>
                            {t(statusMeta.labelKey)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/admin/question-bank?examId=${exam.id}`}>
                                <MaterialIcon name="quiz" className="text-base" />
                                {t("adminExams.manageQuestions")}
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MaterialIcon name="more_vert" className="text-lg" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(exam)}>
                                  <MaterialIcon name="edit" className="text-base" />
                                  {t("common.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/admin/exams/${exam.id}/attempts`}>
                                    <MaterialIcon name="fact_check" className="text-base" />
                                    {t("adminExams.viewAttempts")}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => publishMutation.mutate(exam.id)}
                                  disabled={exam.status === "published"}
                                >
                                  <MaterialIcon name="publish" className="text-base" />
                                  {t("common.publish")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => closeMutation.mutate(exam.id)}
                                  disabled={exam.status === "closed"}
                                >
                                  <MaterialIcon name="lock" className="text-base" />
                                  {t("common.close")}
                                </DropdownMenuItem>
                                <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(exam)}>
                                  <MaterialIcon name="delete" className="text-base" />
                                  {t("common.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
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
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editing ? t("adminExams.sheetTitleEdit") : t("adminExams.sheetTitleCreate")}</SheetTitle>
            <SheetDescription>
              {editing ? t("adminExams.sheetDescEdit") : t("adminExams.sheetDescCreate")}
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-4 overflow-y-auto px-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="title">{t("adminExams.fieldTitle")}</Label>
              <Input id="title" {...register("title")} aria-invalid={Boolean(errors.title)} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="arabic_title">{t("adminExams.fieldArabicTitle")}</Label>
              <Input id="arabic_title" dir="rtl" className="font-arabic" {...register("arabic_title")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">{t("adminExams.fieldDescription")}</Label>
              <Textarea id="description" rows={2} {...register("description")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("adminExams.fieldCourse")}</Label>
                <Controller
                  control={control}
                  name="course_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("adminExams.selectCoursePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
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

              <div className="space-y-1.5">
                <Label>{t("adminExams.fieldClass")}</Label>
                <Controller
                  control={control}
                  name="class_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("adminExams.selectClassPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {classOptions.map((cls) => (
                          <SelectItem key={cls.id} value={String(cls.id)}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("adminExams.fieldLanguage")}</Label>
              <Controller
                control={control}
                name="language"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("adminExams.selectLanguagePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {t(LANGUAGE_META[lang].labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="duration_minutes">{t("adminExams.fieldDurationMinutes")}</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  min={1}
                  {...register("duration_minutes", { valueAsNumber: true })}
                />
                {errors.duration_minutes && (
                  <p className="text-xs text-destructive">{errors.duration_minutes.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pass_mark">{t("adminExams.fieldPassMark")}</Label>
                <Input id="pass_mark" type="number" min={0} {...register("pass_mark", { valueAsNumber: true })} />
                {errors.pass_mark && <p className="text-xs text-destructive">{errors.pass_mark.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="max_attempts">{t("adminExams.fieldMaxAttempts")}</Label>
                <Input
                  id="max_attempts"
                  type="number"
                  min={1}
                  {...register("max_attempts", { valueAsNumber: true })}
                />
                {errors.max_attempts && <p className="text-xs text-destructive">{errors.max_attempts.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t("adminExams.fieldStatus")}</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(["draft", "published", "closed"] as const).map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(STATUS_META[status].labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="starts_at">{t("adminExams.fieldStartsAt")}</Label>
                <Input id="starts_at" type="datetime-local" {...register("starts_at")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ends_at">{t("adminExams.fieldEndsAt")}</Label>
                <Input id="ends_at" type="datetime-local" {...register("ends_at")} />
              </div>
            </div>

            <SheetFooter className="mt-auto px-0">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("common.saving") : editing ? t("adminShared.saveChanges") : t("adminExams.createExamBtn")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                {t("common.cancel")}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminExams.deleteDialogTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {t("adminExams.deleteConfirm", { title: deleteTarget?.title ?? "" })}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

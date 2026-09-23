import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { QueryState } from "@/components/states/QueryState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { adminCoursesApi, type CoursePayload } from "@/api/admin/courses";
import { adminClassesApi } from "@/api/admin/classes";
import { ApiClientError } from "@/api/client";
import type { Course } from "@/types/academic";

function buildSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t("adminCourses.nameRequired")),
    arabic_name: z.string().optional(),
    description: z.string().optional(),
    arabic_description: z.string().optional(),
    language: z.enum(["english", "arabic", "both"], { message: t("adminCourses.selectLanguageError") }),
    // Unrestricted (no class) courses are valid on the backend — "none" maps to null.
    class_id: z.string().optional(),
    duration: z.string().optional(),
    teacher_name: z.string().optional(),
    thumbnail: z.instanceof(File).optional(),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function AdminCoursesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formTarget, setFormTarget] = useState<Course | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const coursesQuery = useQuery({
    queryKey: ["admin", "courses", { page, search }],
    queryFn: () => adminCoursesApi.list({ page, per_page: 15, search: search || undefined }),
  });

  const classesQuery = useQuery({ queryKey: ["admin", "classes", "all"], queryFn: () => adminClassesApi.list() });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
  }

  const createMutation = useMutation({
    mutationFn: (payload: CoursePayload) => adminCoursesApi.create(payload),
    onSuccess: () => {
      toast.success(t("adminCourses.toastCreated"));
      invalidate();
      setFormTarget(null);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminCourses.toastCreateError"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CoursePayload> }) =>
      adminCoursesApi.update(id, payload),
    onSuccess: () => {
      toast.success(t("adminCourses.toastUpdated"));
      invalidate();
      setFormTarget(null);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminCourses.toastUpdateError"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminCoursesApi.remove(id),
    onSuccess: () => {
      toast.success(t("adminCourses.toastDeleted"));
      invalidate();
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminCourses.toastDeleteError"));
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, publish }: { id: number; publish: boolean }) =>
      publish ? adminCoursesApi.publish(id) : adminCoursesApi.unpublish(id),
    onSuccess: (_, { publish }) => {
      toast.success(publish ? t("adminCourses.toastPublished") : t("adminCourses.toastUnpublished"));
      invalidate();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminCourses.toastPublishError"));
    },
  });

  function handleFormSubmit(values: FormValues) {
    const payload: CoursePayload = {
      name: values.name,
      arabic_name: values.arabic_name || undefined,
      description: values.description || undefined,
      arabic_description: values.arabic_description || undefined,
      language: values.language,
      class_id: values.class_id && values.class_id !== "none" ? Number(values.class_id) : null,
      duration: values.duration || undefined,
      teacher_name: values.teacher_name || undefined,
      thumbnail: values.thumbnail,
    };
    if (formTarget && formTarget !== "new") {
      updateMutation.mutate({ id: formTarget.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("adminCourses.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("adminCourses.subtitle")}</p>
        </div>
        <Button onClick={() => setFormTarget("new")}>
          <MaterialIcon name="add" className="text-base" />
          {t("adminCourses.addCourse")}
        </Button>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <MaterialIcon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400"
        />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("adminCourses.searchPlaceholder")}
          className="h-10 rounded-xl pl-9"
        />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
        <QueryState
          isLoading={coursesQuery.isLoading}
          error={coursesQuery.error}
          data={coursesQuery.data}
          onRetry={() => coursesQuery.refetch()}
          isEmpty={(d) => d.items.length === 0}
          emptyProps={{ icon: "menu_book", title: t("adminCourses.emptyTitle"), description: t("adminCourses.emptyDescription") }}
        >
          {(data) => (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminCourses.colCourse")}</TableHead>
                    <TableHead>{t("adminCourses.colClass")}</TableHead>
                    <TableHead>{t("adminCourses.colTeacher")}</TableHead>
                    <TableHead>{t("adminCourses.colLanguage")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{course.name}</span>
                          {course.arabic_name && (
                            <span dir="rtl" className="font-arabic text-xs text-slate-500">
                              {course.arabic_name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{course.class?.name ?? t("adminCourses.unrestricted")}</TableCell>
                      <TableCell>{course.teacher_name ?? "—"}</TableCell>
                      <TableCell className="capitalize">
                        {course.language === "english"
                          ? t("adminShared.languageEnglish")
                          : course.language === "arabic"
                            ? t("adminShared.languageArabic")
                            : t("adminShared.languageBoth")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            course.status === "published"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : course.status === "archived"
                                ? "border-slate-200 bg-slate-50 text-slate-500"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                          }
                        >
                          {course.status === "published"
                            ? t("adminShared.statusContent.published")
                            : course.status === "archived"
                              ? t("adminShared.statusContent.archived")
                              : t("adminShared.statusContent.draft")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MaterialIcon name="more_vert" className="text-lg" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setFormTarget(course)}>
                              <MaterialIcon name="edit" className="text-base" />
                              {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                publishMutation.mutate({ id: course.id, publish: course.status !== "published" })
                              }
                              disabled={publishMutation.isPending}
                            >
                              <MaterialIcon name={course.status === "published" ? "unpublished" : "publish"} className="text-base" />
                              {course.status === "published" ? t("common.unpublish") : t("common.publish")}
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(course)}>
                              <MaterialIcon name="delete" className="text-base" />
                              {t("common.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data.meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    {t("adminCourses.pageInfo", {
                      current: data.meta.current_page,
                      last: data.meta.last_page,
                      total: data.meta.total,
                    })}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      {t("common.previous")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.meta.last_page}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      {t("common.next")}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </QueryState>
      </div>

      <CourseFormSheet
        target={formTarget}
        onOpenChange={(open) => !open && setFormTarget(null)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        classOptions={classesQuery.data?.items ?? []}
        onSubmit={handleFormSubmit}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminCourses.deleteDialogTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {t("adminCourses.deleteConfirm", { name: deleteTarget?.name ?? "" })}
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

function CourseFormSheet({
  target,
  onOpenChange,
  isSubmitting,
  classOptions,
  onSubmit,
}: {
  target: Course | "new" | null;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  classOptions: { id: number; name: string }[];
  onSubmit: (values: FormValues) => void;
}) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);
  const isEdit = Boolean(target && target !== "new");
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: target && target !== "new" ? target.name : "",
      arabic_name: target && target !== "new" ? (target.arabic_name ?? "") : "",
      description: target && target !== "new" ? (target.description ?? "") : "",
      arabic_description: target && target !== "new" ? (target.arabic_description ?? "") : "",
      language: target && target !== "new" ? target.language : "english",
      class_id: target && target !== "new" ? (target.class_id ? String(target.class_id) : "none") : "none",
      duration: target && target !== "new" ? (target.duration ?? "") : "",
      teacher_name: target && target !== "new" ? (target.teacher_name ?? "") : "",
      thumbnail: undefined,
    },
  });

  return (
    <Sheet
      open={Boolean(target)}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEdit ? t("adminCourses.formTitleEdit") : t("adminCourses.formTitleAdd")}</SheetTitle>
        </SheetHeader>
        <form className="flex flex-1 flex-col gap-4 overflow-y-auto px-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("adminCourses.fieldCourseName")}</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="arabic_name">{t("adminCourses.fieldArabicName")}</Label>
            <Input id="arabic_name" dir="rtl" className="font-arabic" {...register("arabic_name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">{t("adminCourses.fieldDescription")}</Label>
            <Textarea id="description" className="min-h-24" {...register("description")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="arabic_description">{t("adminCourses.fieldArabicDescription")}</Label>
            <Textarea id="arabic_description" dir="rtl" className="min-h-24 font-arabic" {...register("arabic_description")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="language">{t("adminCourses.fieldLanguage")}</Label>
              <Controller
                control={control}
                name="language"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="language" className="w-full">
                      <SelectValue placeholder={t("adminCourses.selectLanguagePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">{t("adminShared.languageEnglish")}</SelectItem>
                      <SelectItem value="arabic">{t("adminShared.languageArabic")}</SelectItem>
                      <SelectItem value="both">{t("adminShared.languageBoth")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.language && <p className="text-xs text-destructive">{errors.language.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="class_id">{t("adminCourses.fieldClass")}</Label>
              <Controller
                control={control}
                name="class_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="class_id" className="w-full">
                      <SelectValue placeholder={t("adminCourses.selectClassPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("adminShared.unrestricted")}</SelectItem>
                      {classOptions.map((level) => (
                        <SelectItem key={level.id} value={String(level.id)}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="teacher_name">{t("adminCourses.fieldTeacherName")}</Label>
              <Input id="teacher_name" placeholder={t("adminCourses.teacherPlaceholder")} {...register("teacher_name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">{t("adminCourses.fieldDuration")}</Label>
              <Input id="duration" placeholder={t("adminCourses.durationPlaceholder")} {...register("duration")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="thumbnail">{isEdit ? t("adminCourses.fieldThumbnailOptional") : t("adminCourses.fieldThumbnail")}</Label>
            <Controller
              control={control}
              name="thumbnail"
              render={({ field: { onChange, onBlur, ref, name } }) => (
                <Input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  name={name}
                  ref={ref}
                  onBlur={onBlur}
                  onChange={(e) => onChange(e.target.files?.[0])}
                />
              )}
            />
          </div>

          <SheetFooter className="mt-auto flex-row justify-end gap-2 px-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : isEdit ? t("adminShared.saveChanges") : t("adminCourses.createCourse")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

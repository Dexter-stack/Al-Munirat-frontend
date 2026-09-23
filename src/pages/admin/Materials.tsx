import { useMemo, useState } from "react";
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
import { Progress } from "@/components/ui/progress";
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
import { adminMaterialsApi } from "@/api/admin/materials";
import { adminCoursesApi } from "@/api/admin/courses";
import { ApiClientError } from "@/api/client";
import type { Material, MaterialType } from "@/types/academic";

const MATERIAL_TYPES: MaterialType[] = ["pdf", "video", "audio", "document", "image", "text"];

const TYPE_META: Record<MaterialType, { icon: string; labelKey: string; className: string }> = {
  pdf: { icon: "picture_as_pdf", labelKey: "adminMaterials.typePdf", className: "border-rose-100 bg-rose-50 text-rose-700" },
  video: { icon: "videocam", labelKey: "adminMaterials.typeVideo", className: "border-brand-100 bg-brand-50 text-brand-700" },
  audio: { icon: "headphones", labelKey: "adminMaterials.typeAudio", className: "border-amber-100 bg-amber-50 text-amber-700" },
  document: { icon: "description", labelKey: "adminMaterials.typeDocument", className: "border-slate-200 bg-slate-100 text-slate-700" },
  image: { icon: "image", labelKey: "adminMaterials.typeImage", className: "border-emerald-100 bg-emerald-50 text-emerald-700" },
  text: { icon: "sticky_note_2", labelKey: "adminMaterials.typeNotes", className: "border-sky-100 bg-sky-50 text-sky-700" },
};

function buildMaterialSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().min(1, t("adminMaterials.titleRequired")),
    arabic_title: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(["pdf", "video", "audio", "document", "image", "text"]),
    // Nullable on the backend — a material can be course-scoped, class-scoped, or open to all.
    course_id: z.string().optional(),
    file: z.instanceof(File).optional(),
  });
}

type MaterialFormValues = z.infer<ReturnType<typeof buildMaterialSchema>>;

const EMPTY_VALUES: MaterialFormValues = {
  title: "",
  arabic_title: "",
  description: "",
  type: "pdf",
  course_id: "",
  file: undefined,
};

export default function AdminMaterialsPage() {
  const { t } = useTranslation();
  const materialSchema = useMemo(() => buildMaterialSchema(t), [t]);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const materialsQuery = useQuery({
    queryKey: ["admin", "materials", { page }],
    queryFn: () => adminMaterialsApi.list({ page }),
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
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: EMPTY_VALUES,
  });

  function openCreate() {
    setEditing(null);
    reset(EMPTY_VALUES);
    setUploadProgress(0);
    setSheetOpen(true);
  }

  function openEdit(material: Material) {
    setEditing(material);
    reset({
      title: material.title,
      arabic_title: material.arabic_title ?? "",
      description: material.description ?? "",
      type: material.type,
      course_id: material.course_id ? String(material.course_id) : "",
      file: undefined,
    });
    setUploadProgress(0);
    setSheetOpen(true);
  }

  const createMutation = useMutation({
    mutationFn: (values: MaterialFormValues) =>
      adminMaterialsApi.create(
        {
          title: values.title,
          arabic_title: values.arabic_title || undefined,
          description: values.description || undefined,
          type: values.type,
          course_id: values.course_id ? Number(values.course_id) : null,
          file: values.file,
        },
        setUploadProgress,
      ),
    onSuccess: () => {
      toast.success(t("adminMaterials.toastUploaded"));
      queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
      setSheetOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminMaterials.toastUploadError"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: MaterialFormValues }) =>
      adminMaterialsApi.update(id, {
        title: values.title,
        arabic_title: values.arabic_title || undefined,
        description: values.description || undefined,
        type: values.type,
        course_id: values.course_id ? Number(values.course_id) : null,
      }),
    onSuccess: () => {
      toast.success(t("adminMaterials.toastUpdated"));
      queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
      setSheetOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminMaterials.toastUpdateError"));
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, publish }: { id: number; publish: boolean }) =>
      publish ? adminMaterialsApi.publish(id) : adminMaterialsApi.unpublish(id),
    onSuccess: (_data, variables) => {
      toast.success(variables.publish ? t("adminMaterials.toastPublished") : t("adminMaterials.toastUnpublished"));
      queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminMaterials.toastActionError"));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => adminMaterialsApi.remove(id),
    onSuccess: () => {
      toast.success(t("adminMaterials.toastDeleted"));
      queryClient.invalidateQueries({ queryKey: ["admin", "materials"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminMaterials.toastDeleteError"));
    },
  });

  function onSubmit(values: MaterialFormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, values });
    } else {
      if (!values.file) {
        toast.error(t("adminMaterials.toastSelectFile"));
        return;
      }
      createMutation.mutate(values);
    }
  }

  function handleDelete(material: Material) {
    if (window.confirm(t("adminMaterials.confirmDelete", { title: material.title }))) {
      removeMutation.mutate(material.id);
    }
  }

  const courseOptions = useMemo(() => coursesQuery.data?.items ?? [], [coursesQuery.data]);
  const courseNameById = useMemo(() => new Map(courseOptions.map((c) => [c.id, c.name])), [courseOptions]);
  const isSaving = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("adminMaterials.title")}
        description={t("adminMaterials.subtitle")}
        action={
          <Button onClick={openCreate}>
            <MaterialIcon name="upload_file" className="text-base" />
            {t("adminMaterials.uploadMaterial")}
          </Button>
        }
      />

      <QueryState
        isLoading={materialsQuery.isLoading}
        error={materialsQuery.error}
        data={materialsQuery.data}
        onRetry={() => materialsQuery.refetch()}
        isEmpty={(d) => d.items.length === 0}
        emptyProps={{
          icon: "folder_open",
          title: t("adminMaterials.emptyTitle"),
          description: t("adminMaterials.emptyDescription"),
        }}
      >
        {(data) => (
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminMaterials.colTitle")}</TableHead>
                    <TableHead>{t("adminMaterials.colType")}</TableHead>
                    <TableHead>{t("adminMaterials.colCourse")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((material) => {
                    const meta = TYPE_META[material.type];
                    return (
                      <TableRow key={material.id}>
                        <TableCell className="max-w-[260px]">
                          <p className="truncate font-semibold text-slate-900">{material.title}</p>
                          {material.arabic_title && (
                            <p dir="rtl" className="truncate font-arabic text-xs text-slate-500">
                              {material.arabic_title}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={meta.className}>
                            <MaterialIcon name={meta.icon} className="text-sm" />
                            {t(meta.labelKey)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {material.course_id ? (courseNameById.get(material.course_id) ?? "—") : t("adminMaterials.allClasses")}
                        </TableCell>
                        <TableCell>
                          {material.status === "published" ? (
                            <Badge variant="outline" className="border-emerald-100 bg-emerald-50 text-emerald-700">
                              {t("adminShared.statusContent.published")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                              {t("adminShared.statusContent.draft")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MaterialIcon name="more_vert" className="text-lg" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(material)}>
                                <MaterialIcon name="edit" className="text-base" />
                                {t("common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  publishMutation.mutate({ id: material.id, publish: material.status !== "published" })
                                }
                              >
                                <MaterialIcon
                                  name={material.status === "published" ? "visibility_off" : "visibility"}
                                  className="text-base"
                                />
                                {material.status === "published" ? t("common.unpublish") : t("common.publish")}
                              </DropdownMenuItem>
                              <DropdownMenuItem variant="destructive" onClick={() => handleDelete(material)}>
                                <MaterialIcon name="delete" className="text-base" />
                                {t("common.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? t("adminMaterials.sheetTitleEdit") : t("adminMaterials.sheetTitleUpload")}</SheetTitle>
            <SheetDescription>
              {editing ? t("adminMaterials.sheetDescEdit") : t("adminMaterials.sheetDescUpload")}
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-4 overflow-y-auto px-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="title">{t("adminMaterials.fieldTitle")}</Label>
              <Input id="title" {...register("title")} aria-invalid={Boolean(errors.title)} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="arabic_title">{t("adminMaterials.fieldArabicTitle")}</Label>
              <Input id="arabic_title" dir="rtl" className="font-arabic" {...register("arabic_title")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">{t("adminMaterials.fieldDescription")}</Label>
              <Textarea id="description" rows={3} {...register("description")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("adminMaterials.fieldType")}</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("adminMaterials.selectTypePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAL_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(TYPE_META[type].labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("adminMaterials.fieldCourseOptional")}</Label>
                <Controller
                  control={control}
                  name="course_id"
                  render={({ field }) => (
                    <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("adminMaterials.selectCoursePlaceholder")} />
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
                {errors.course_id && <p className="text-xs text-destructive">{errors.course_id.message}</p>}
              </div>
            </div>

            {!editing && (
              <div className="space-y-1.5">
                <Label htmlFor="file">{t("adminMaterials.fieldFile")}</Label>
                <Controller
                  control={control}
                  name="file"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => onChange(e.target.files?.[0])}
                      {...field}
                      value={undefined}
                    />
                  )}
                />
              </div>
            )}

            {editing && (
              <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                {t("adminMaterials.replaceFileHint")}
              </p>
            )}

            {createMutation.isPending && uploadProgress > 0 && (
              <div className="space-y-1">
                <Progress value={uploadProgress} />
                <p className="text-xs text-slate-500">{t("adminMaterials.uploadingProgress", { percent: uploadProgress })}</p>
              </div>
            )}

            <SheetFooter className="mt-auto px-0">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("common.saving") : editing ? t("adminShared.saveChanges") : t("adminMaterials.upload")}
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

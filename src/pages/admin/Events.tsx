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
import { adminEventsApi } from "@/api/admin/events";
import { ApiClientError } from "@/api/client";
import type { EventItem } from "@/types/content";

const CATEGORIES = ["Seminar", "Announcement", "Workshop", "Lecture", "Conference"];
const CATEGORY_LABEL_KEYS: Record<string, string> = {
  Seminar: "adminEvents.categorySeminar",
  Announcement: "adminEvents.categoryAnnouncement",
  Workshop: "adminEvents.categoryWorkshop",
  Lecture: "adminEvents.categoryLecture",
  Conference: "adminEvents.categoryConference",
};

function buildEventSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().min(1, t("adminEvents.titleRequired")),
    arabic_title: z.string().optional(),
    content: z.string().min(1, t("adminEvents.contentRequired")),
    arabic_content: z.string().optional(),
    category: z.string().min(1, t("adminEvents.categoryRequired")),
    event_date: z.string().optional(),
    featured_image: z.instanceof(File).optional(),
  });
}

type EventFormValues = z.infer<ReturnType<typeof buildEventSchema>>;

const EMPTY_VALUES: EventFormValues = {
  title: "",
  arabic_title: "",
  content: "",
  arabic_content: "",
  category: "",
  event_date: "",
  featured_image: undefined,
};

export default function AdminEventsPage() {
  const { t } = useTranslation();
  const eventSchema = useMemo(() => buildEventSchema(t), [t]);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);

  const eventsQuery = useQuery({
    queryKey: ["admin", "events", { page }],
    queryFn: () => adminEventsApi.list({ page }),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: EMPTY_VALUES,
  });

  function openCreate() {
    setEditing(null);
    reset(EMPTY_VALUES);
    setSheetOpen(true);
  }

  function openEdit(event: EventItem) {
    setEditing(event);
    reset({
      title: event.title,
      arabic_title: event.arabic_title ?? "",
      content: event.content,
      arabic_content: event.arabic_content ?? "",
      category: event.category,
      event_date: event.event_date ?? "",
      featured_image: undefined,
    });
    setSheetOpen(true);
  }

  const createMutation = useMutation({
    mutationFn: (values: EventFormValues) =>
      adminEventsApi.create({
        title: values.title,
        arabic_title: values.arabic_title || undefined,
        content: values.content,
        arabic_content: values.arabic_content || undefined,
        category: values.category,
        event_date: values.event_date || undefined,
        featured_image: values.featured_image,
      }),
    onSuccess: () => {
      toast.success(t("adminEvents.toastCreated"));
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
      setSheetOpen(false);
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminEvents.toastCreateError")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: EventFormValues }) =>
      adminEventsApi.update(id, {
        title: values.title,
        arabic_title: values.arabic_title || undefined,
        content: values.content,
        arabic_content: values.arabic_content || undefined,
        category: values.category,
        event_date: values.event_date || undefined,
      }),
    onSuccess: () => {
      toast.success(t("adminEvents.toastUpdated"));
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
      setSheetOpen(false);
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminEvents.toastUpdateError")),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, publish }: { id: number; publish: boolean }) =>
      publish ? adminEventsApi.publish(id) : adminEventsApi.unpublish(id),
    onSuccess: (_data, variables) => {
      toast.success(variables.publish ? t("adminEvents.toastPublished") : t("adminEvents.toastUnpublished"));
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminEvents.toastActionError")),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => adminEventsApi.remove(id),
    onSuccess: () => {
      toast.success(t("adminEvents.toastDeleted"));
      queryClient.invalidateQueries({ queryKey: ["admin", "events"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminEvents.toastDeleteError")),
  });

  function onSubmit(values: EventFormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, values });
    } else {
      createMutation.mutate(values);
    }
  }

  function handleDelete(event: EventItem) {
    if (window.confirm(t("adminEvents.confirmDelete", { title: event.title }))) {
      removeMutation.mutate(event.id);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("adminEvents.title")}
        description={t("adminEvents.subtitle")}
        action={
          <Button onClick={openCreate}>
            <MaterialIcon name="add" className="text-base" />
            {t("adminEvents.createEvent")}
          </Button>
        }
      />

      <QueryState
        isLoading={eventsQuery.isLoading}
        error={eventsQuery.error}
        data={eventsQuery.data}
        onRetry={() => eventsQuery.refetch()}
        isEmpty={(d) => d.items.length === 0}
        emptyProps={{ icon: "event", title: t("adminEvents.emptyTitle"), description: t("adminEvents.emptyDescription") }}
      >
        {(data) => (
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminEvents.colEvent")}</TableHead>
                    <TableHead>{t("adminEvents.colCategory")}</TableHead>
                    <TableHead>{t("adminEvents.colDate")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="max-w-[280px]">
                        <div className="flex items-center gap-3">
                          {event.featured_image_url ? (
                            <img
                              src={event.featured_image_url}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                              <MaterialIcon name="event" className="text-lg" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{event.title}</p>
                            {event.arabic_title && (
                              <p dir="rtl" className="truncate font-arabic text-xs text-slate-500">
                                {event.arabic_title}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-brand-100 bg-brand-50 text-brand-700">
                          {CATEGORY_LABEL_KEYS[event.category] ? t(CATEGORY_LABEL_KEYS[event.category]) : event.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {event.event_date ? new Date(event.event_date).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        {event.is_published ? (
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
                            <DropdownMenuItem onClick={() => openEdit(event)}>
                              <MaterialIcon name="edit" className="text-base" />
                              {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => publishMutation.mutate({ id: event.id, publish: !event.is_published })}
                            >
                              <MaterialIcon
                                name={event.is_published ? "visibility_off" : "visibility"}
                                className="text-base"
                              />
                              {event.is_published ? t("common.unpublish") : t("common.publish")}
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => handleDelete(event)}>
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
            </div>
            <AdminPagination meta={data.meta} onPageChange={setPage} />
          </div>
        )}
      </QueryState>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editing ? t("adminEvents.sheetTitleEdit") : t("adminEvents.sheetTitleCreate")}</SheetTitle>
            <SheetDescription>
              {editing ? t("adminEvents.sheetDescEdit") : t("adminEvents.sheetDescCreate")}
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-4 overflow-y-auto px-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="title">{t("adminEvents.fieldTitle")}</Label>
              <Input id="title" {...register("title")} aria-invalid={Boolean(errors.title)} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="arabic_title">{t("adminEvents.fieldArabicTitle")}</Label>
              <Input id="arabic_title" dir="rtl" className="font-arabic" {...register("arabic_title")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content">{t("adminEvents.fieldContent")}</Label>
              <Textarea id="content" rows={6} {...register("content")} aria-invalid={Boolean(errors.content)} />
              {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="arabic_content">{t("adminEvents.fieldArabicContent")}</Label>
              <Textarea id="arabic_content" dir="rtl" className="font-arabic" rows={4} {...register("arabic_content")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("adminEvents.fieldCategory")}</Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("adminEvents.selectCategoryPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {t(CATEGORY_LABEL_KEYS[category])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event_date">{t("adminEvents.fieldEventDate")}</Label>
                <Input id="event_date" type="date" {...register("event_date")} />
              </div>
            </div>

            {!editing && (
              <div className="space-y-1.5">
                <Label htmlFor="featured_image">{t("adminEvents.fieldFeaturedImage")}</Label>
                <Controller
                  control={control}
                  name="featured_image"
                  render={({ field: { onChange, ...field } }) => (
                    <Input
                      id="featured_image"
                      type="file"
                      accept="image/*"
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
                {t("adminEvents.replaceImageHint")}
              </p>
            )}

            <SheetFooter className="mt-auto px-0">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("common.saving") : editing ? t("adminShared.saveChanges") : t("adminEvents.createEventBtn")}
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

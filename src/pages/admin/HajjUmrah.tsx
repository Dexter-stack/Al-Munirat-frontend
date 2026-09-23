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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { adminHajjUmrahApi } from "@/api/admin/hajjUmrah";
import { ApiClientError } from "@/api/client";
import type { HajjUmrahAnnouncement, HajjUmrahFaq, HajjUmrahPackage } from "@/types/content";

export default function AdminHajjUmrahPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("adminHajjUmrah.title")}
        description={t("adminHajjUmrah.subtitle")}
      />

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">{t("adminHajjUmrah.tabPackages")}</TabsTrigger>
          <TabsTrigger value="faqs">{t("adminHajjUmrah.tabFaqs")}</TabsTrigger>
          <TabsTrigger value="announcements">{t("adminHajjUmrah.tabAnnouncements")}</TabsTrigger>
        </TabsList>
        <TabsContent value="packages" className="pt-4">
          <PackagesTab />
        </TabsContent>
        <TabsContent value="faqs" className="pt-4">
          <FaqsTab />
        </TabsContent>
        <TabsContent value="announcements" className="pt-4">
          <AnnouncementsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ----------------------------- Packages ----------------------------- */

function buildPackageSchema(t: (key: string) => string) {
  return z.object({
    type: z.enum(["hajj", "umrah"]),
    title: z.string().min(1, t("adminHajjUmrah.titleRequired")),
    arabic_title: z.string().optional(),
    description: z.string().min(1, t("adminHajjUmrah.descriptionRequired")),
    arabic_description: z.string().optional(),
    price: z.string().optional(),
    currency: z.string().optional(),
    duration_days: z.string().optional(),
    is_published: z.boolean(),
  });
}

type PackageFormValues = z.infer<ReturnType<typeof buildPackageSchema>>;

const EMPTY_PACKAGE: PackageFormValues = {
  type: "hajj",
  title: "",
  arabic_title: "",
  description: "",
  arabic_description: "",
  price: "",
  currency: "USD",
  duration_days: "",
  is_published: false,
};

function PackagesTab() {
  const { t } = useTranslation();
  const packageSchema = useMemo(() => buildPackageSchema(t), [t]);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<HajjUmrahPackage | null>(null);

  const packagesQuery = useQuery({
    queryKey: ["admin", "hajj-umrah", "packages", { page }],
    queryFn: () => adminHajjUmrahApi.packages.list({ page }),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PackageFormValues>({ resolver: zodResolver(packageSchema), defaultValues: EMPTY_PACKAGE });

  function openCreate() {
    setEditing(null);
    reset(EMPTY_PACKAGE);
    setSheetOpen(true);
  }

  function openEdit(pkg: HajjUmrahPackage) {
    setEditing(pkg);
    reset({
      type: pkg.type,
      title: pkg.title,
      arabic_title: pkg.arabic_title ?? "",
      description: pkg.description,
      arabic_description: pkg.arabic_description ?? "",
      price: pkg.price != null ? String(pkg.price) : "",
      currency: pkg.currency ?? "",
      duration_days: pkg.duration_days != null ? String(pkg.duration_days) : "",
      is_published: pkg.is_published,
    });
    setSheetOpen(true);
  }

  function toPayload(values: PackageFormValues) {
    return {
      type: values.type,
      title: values.title,
      arabic_title: values.arabic_title || undefined,
      description: values.description,
      arabic_description: values.arabic_description || undefined,
      price: values.price ? Number(values.price) : undefined,
      currency: values.currency || undefined,
      duration_days: values.duration_days ? Number(values.duration_days) : undefined,
      is_published: values.is_published,
    };
  }

  const createMutation = useMutation({
    mutationFn: adminHajjUmrahApi.packages.create,
    onSuccess: () => {
      toast.success(t("adminHajjUmrah.toastPackageCreated"));
      queryClient.invalidateQueries({ queryKey: ["admin", "hajj-umrah", "packages"] });
      setSheetOpen(false);
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminHajjUmrah.toastPackageCreateError")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReturnType<typeof toPayload> }) =>
      adminHajjUmrahApi.packages.update(id, payload),
    onSuccess: () => {
      toast.success(t("adminHajjUmrah.toastPackageUpdated"));
      queryClient.invalidateQueries({ queryKey: ["admin", "hajj-umrah", "packages"] });
      setSheetOpen(false);
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminHajjUmrah.toastPackageUpdateError")),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, publish }: { id: number; publish: boolean }) =>
      publish ? adminHajjUmrahApi.packages.publish(id) : adminHajjUmrahApi.packages.unpublish(id),
    onSuccess: (_d, variables) => {
      toast.success(variables.publish ? t("adminHajjUmrah.toastPackagePublished") : t("adminHajjUmrah.toastPackageUnpublished"));
      queryClient.invalidateQueries({ queryKey: ["admin", "hajj-umrah", "packages"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminHajjUmrah.toastActionError")),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => adminHajjUmrahApi.packages.remove(id),
    onSuccess: () => {
      toast.success(t("adminHajjUmrah.toastPackageDeleted"));
      queryClient.invalidateQueries({ queryKey: ["admin", "hajj-umrah", "packages"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminHajjUmrah.toastPackageDeleteError")),
  });

  function onSubmit(values: PackageFormValues) {
    const payload = toPayload(values);
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleDelete(pkg: HajjUmrahPackage) {
    if (window.confirm(t("adminHajjUmrah.confirmDeletePackage", { title: pkg.title }))) {
      removeMutation.mutate(pkg.id);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <MaterialIcon name="add" className="text-base" />
          {t("adminHajjUmrah.addPackage")}
        </Button>
      </div>

      <QueryState
        isLoading={packagesQuery.isLoading}
        error={packagesQuery.error}
        data={packagesQuery.data}
        onRetry={() => packagesQuery.refetch()}
        isEmpty={(d) => d.items.length === 0}
        emptyProps={{ icon: "mosque", title: t("adminHajjUmrah.emptyTitlePackages"), description: t("adminHajjUmrah.emptyDescPackages") }}
      >
        {(data) => (
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminHajjUmrah.colPackage")}</TableHead>
                    <TableHead>{t("adminHajjUmrah.colType")}</TableHead>
                    <TableHead>{t("adminHajjUmrah.colPrice")}</TableHead>
                    <TableHead>{t("adminHajjUmrah.colDuration")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="max-w-[220px]">
                        <p className="truncate font-semibold text-slate-900">{pkg.title}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            pkg.type === "hajj"
                              ? "border-brand-100 bg-brand-50 text-brand-700"
                              : "border-emerald-100 bg-emerald-50 text-emerald-700"
                          }
                        >
                          {pkg.type === "hajj" ? t("adminHajjUmrah.typeHajj") : t("adminHajjUmrah.typeUmrah")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {pkg.price != null ? `${pkg.currency ?? ""} ${pkg.price}`.trim() : "—"}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {pkg.duration_days != null ? t("adminHajjUmrah.durationDays", { count: pkg.duration_days }) : "—"}
                      </TableCell>
                      <TableCell>
                        {pkg.is_published ? (
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
                            <DropdownMenuItem onClick={() => openEdit(pkg)}>
                              <MaterialIcon name="edit" className="text-base" />
                              {t("common.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => publishMutation.mutate({ id: pkg.id, publish: !pkg.is_published })}
                            >
                              <MaterialIcon
                                name={pkg.is_published ? "visibility_off" : "visibility"}
                                className="text-base"
                              />
                              {pkg.is_published ? t("common.unpublish") : t("common.publish")}
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => handleDelete(pkg)}>
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
            <SheetTitle>{editing ? t("adminHajjUmrah.sheetTitleEditPackage") : t("adminHajjUmrah.sheetTitleAddPackage")}</SheetTitle>
            <SheetDescription>
              {editing ? t("adminHajjUmrah.sheetDescEditPackage") : t("adminHajjUmrah.sheetDescAddPackage")}
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-4 overflow-y-auto px-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label>{t("adminHajjUmrah.fieldType")}</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hajj">{t("adminHajjUmrah.typeHajj")}</SelectItem>
                      <SelectItem value="umrah">{t("adminHajjUmrah.typeUmrah")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pkg_title">{t("adminHajjUmrah.fieldTitle")}</Label>
              <Input id="pkg_title" {...register("title")} aria-invalid={Boolean(errors.title)} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pkg_arabic_title">{t("adminHajjUmrah.fieldArabicTitle")}</Label>
              <Input id="pkg_arabic_title" dir="rtl" className="font-arabic" {...register("arabic_title")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pkg_description">{t("adminHajjUmrah.fieldDescription")}</Label>
              <Textarea id="pkg_description" rows={4} {...register("description")} aria-invalid={Boolean(errors.description)} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pkg_arabic_description">{t("adminHajjUmrah.fieldArabicDescription")}</Label>
              <Textarea id="pkg_arabic_description" dir="rtl" className="font-arabic" rows={3} {...register("arabic_description")} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pkg_price">{t("adminHajjUmrah.fieldPrice")}</Label>
                <Input id="pkg_price" type="number" min={0} step="0.01" {...register("price")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pkg_currency">{t("adminHajjUmrah.fieldCurrency")}</Label>
                <Input id="pkg_currency" placeholder="USD" {...register("currency")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pkg_duration">{t("adminHajjUmrah.fieldDurationDays")}</Label>
                <Input id="pkg_duration" type="number" min={1} {...register("duration_days")} />
              </div>
            </div>

            <Controller
              control={control}
              name="is_published"
              render={({ field }) => (
                <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                  <span className="text-sm font-medium text-slate-700">{t("adminHajjUmrah.publishImmediately")}</span>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </label>
              )}
            />

            <SheetFooter className="mt-auto px-0">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("common.saving") : editing ? t("adminShared.saveChanges") : t("adminHajjUmrah.addPackageBtn")}
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

/* -------------------------------- FAQs -------------------------------- */

function buildFaqSchema(t: (key: string) => string) {
  return z.object({
    question: z.string().min(1, t("adminHajjUmrah.questionRequired")),
    arabic_question: z.string().optional(),
    answer: z.string().min(1, t("adminHajjUmrah.answerRequired")),
    arabic_answer: z.string().optional(),
  });
}

type FaqFormValues = z.infer<ReturnType<typeof buildFaqSchema>>;

const EMPTY_FAQ: FaqFormValues = { question: "", arabic_question: "", answer: "", arabic_answer: "" };

function FaqsTab() {
  const { t } = useTranslation();
  const faqSchema = useMemo(() => buildFaqSchema(t), [t]);
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<HajjUmrahFaq | null>(null);

  const faqsQuery = useQuery({
    queryKey: ["admin", "hajj-umrah", "faqs"],
    queryFn: adminHajjUmrahApi.faqs.list,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FaqFormValues>({ resolver: zodResolver(faqSchema), defaultValues: EMPTY_FAQ });

  function openCreate() {
    setEditing(null);
    reset(EMPTY_FAQ);
    setSheetOpen(true);
  }

  function openEdit(faq: HajjUmrahFaq) {
    setEditing(faq);
    reset({
      question: faq.question,
      arabic_question: faq.arabic_question ?? "",
      answer: faq.answer,
      arabic_answer: faq.arabic_answer ?? "",
    });
    setSheetOpen(true);
  }

  const createMutation = useMutation({
    mutationFn: adminHajjUmrahApi.faqs.create,
    onSuccess: () => {
      toast.success(t("adminHajjUmrah.toastFaqCreated"));
      queryClient.invalidateQueries({ queryKey: ["admin", "hajj-umrah", "faqs"] });
      setSheetOpen(false);
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminHajjUmrah.toastFaqCreateError")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: FaqFormValues }) =>
      adminHajjUmrahApi.faqs.update(id, {
        question: values.question,
        arabic_question: values.arabic_question || undefined,
        answer: values.answer,
        arabic_answer: values.arabic_answer || undefined,
      }),
    onSuccess: () => {
      toast.success(t("adminHajjUmrah.toastFaqUpdated"));
      queryClient.invalidateQueries({ queryKey: ["admin", "hajj-umrah", "faqs"] });
      setSheetOpen(false);
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminHajjUmrah.toastFaqUpdateError")),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => adminHajjUmrahApi.faqs.remove(id),
    onSuccess: () => {
      toast.success(t("adminHajjUmrah.toastFaqDeleted"));
      queryClient.invalidateQueries({ queryKey: ["admin", "hajj-umrah", "faqs"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminHajjUmrah.toastFaqDeleteError")),
  });

  function onSubmit(values: FaqFormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, values });
    } else {
      createMutation.mutate({
        question: values.question,
        arabic_question: values.arabic_question || undefined,
        answer: values.answer,
        arabic_answer: values.arabic_answer || undefined,
      });
    }
  }

  function handleDelete(faq: HajjUmrahFaq) {
    if (window.confirm(t("adminHajjUmrah.confirmDeleteFaq"))) {
      removeMutation.mutate(faq.id);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <MaterialIcon name="add" className="text-base" />
          {t("adminHajjUmrah.addFaq")}
        </Button>
      </div>

      <QueryState
        isLoading={faqsQuery.isLoading}
        error={faqsQuery.error}
        data={faqsQuery.data}
        onRetry={() => faqsQuery.refetch()}
        isEmpty={(d) => d.length === 0}
        emptyProps={{ icon: "help", title: t("adminHajjUmrah.emptyTitleFaqs"), description: t("adminHajjUmrah.emptyDescFaqs") }}
      >
        {(faqs) => (
          <div className="flex flex-col gap-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{faq.question}</p>
                    <p className="mt-1 text-sm text-slate-600">{faq.answer}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" className="shrink-0">
                        <MaterialIcon name="more_vert" className="text-lg" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(faq)}>
                        <MaterialIcon name="edit" className="text-base" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(faq)}>
                        <MaterialIcon name="delete" className="text-base" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </QueryState>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editing ? t("adminHajjUmrah.sheetTitleEditFaq") : t("adminHajjUmrah.sheetTitleAddFaq")}</SheetTitle>
            <SheetDescription>{t("adminHajjUmrah.sheetDescFaq")}</SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-4 overflow-y-auto px-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="question">{t("adminHajjUmrah.fieldQuestion")}</Label>
              <Textarea id="question" rows={2} {...register("question")} aria-invalid={Boolean(errors.question)} />
              {errors.question && <p className="text-xs text-destructive">{errors.question.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="arabic_question">{t("adminHajjUmrah.fieldArabicQuestion")}</Label>
              <Textarea id="arabic_question" dir="rtl" className="font-arabic" rows={2} {...register("arabic_question")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="answer">{t("adminHajjUmrah.fieldAnswer")}</Label>
              <Textarea id="answer" rows={4} {...register("answer")} aria-invalid={Boolean(errors.answer)} />
              {errors.answer && <p className="text-xs text-destructive">{errors.answer.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="arabic_answer">{t("adminHajjUmrah.fieldArabicAnswer")}</Label>
              <Textarea id="arabic_answer" dir="rtl" className="font-arabic" rows={3} {...register("arabic_answer")} />
            </div>

            <SheetFooter className="mt-auto px-0">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("common.saving") : editing ? t("adminShared.saveChanges") : t("adminHajjUmrah.addFaqBtn")}
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

/* --------------------------- Announcements --------------------------- */

function buildAnnouncementSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().min(1, t("adminHajjUmrah.titleRequired")),
    arabic_title: z.string().optional(),
    body: z.string().min(1, t("adminHajjUmrah.bodyRequired")),
    arabic_body: z.string().optional(),
  });
}

type AnnouncementFormValues = z.infer<ReturnType<typeof buildAnnouncementSchema>>;

const EMPTY_ANNOUNCEMENT: AnnouncementFormValues = { title: "", arabic_title: "", body: "", arabic_body: "" };

function AnnouncementsTab() {
  const { t } = useTranslation();
  const announcementSchema = useMemo(() => buildAnnouncementSchema(t), [t]);
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);

  const announcementsQuery = useQuery({
    queryKey: ["admin", "hajj-umrah", "announcements"],
    queryFn: adminHajjUmrahApi.announcements.list,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormValues>({ resolver: zodResolver(announcementSchema), defaultValues: EMPTY_ANNOUNCEMENT });

  const createMutation = useMutation({
    mutationFn: adminHajjUmrahApi.announcements.create,
    onSuccess: () => {
      toast.success(t("adminHajjUmrah.toastAnnouncementPublished"));
      queryClient.invalidateQueries({ queryKey: ["admin", "hajj-umrah", "announcements"] });
      setSheetOpen(false);
      reset(EMPTY_ANNOUNCEMENT);
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminHajjUmrah.toastAnnouncementPublishError")),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => adminHajjUmrahApi.announcements.remove(id),
    onSuccess: () => {
      toast.success(t("adminHajjUmrah.toastAnnouncementDeleted"));
      queryClient.invalidateQueries({ queryKey: ["admin", "hajj-umrah", "announcements"] });
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminHajjUmrah.toastAnnouncementDeleteError")),
  });

  function onSubmit(values: AnnouncementFormValues) {
    createMutation.mutate({
      title: values.title,
      arabic_title: values.arabic_title || undefined,
      body: values.body,
      arabic_body: values.arabic_body || undefined,
    });
  }

  function handleDelete(announcement: HajjUmrahAnnouncement) {
    if (window.confirm(t("adminHajjUmrah.confirmDeleteAnnouncement", { title: announcement.title }))) {
      removeMutation.mutate(announcement.id);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            reset(EMPTY_ANNOUNCEMENT);
            setSheetOpen(true);
          }}
        >
          <MaterialIcon name="campaign" className="text-base" />
          {t("adminHajjUmrah.newAnnouncement")}
        </Button>
      </div>

      <QueryState
        isLoading={announcementsQuery.isLoading}
        error={announcementsQuery.error}
        data={announcementsQuery.data}
        onRetry={() => announcementsQuery.refetch()}
        isEmpty={(d) => d.length === 0}
        emptyProps={{ icon: "campaign", title: t("adminHajjUmrah.emptyTitleAnnouncements") }}
      >
        {(announcements) => (
          <div className="flex flex-col gap-3">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{announcement.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{announcement.body}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(announcement.published_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-destructive"
                    onClick={() => handleDelete(announcement)}
                  >
                    <MaterialIcon name="delete" className="text-lg" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </QueryState>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("adminHajjUmrah.sheetTitleAnnouncement")}</SheetTitle>
            <SheetDescription>{t("adminHajjUmrah.sheetDescAnnouncement")}</SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-4 overflow-y-auto px-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="ann_title">{t("adminHajjUmrah.fieldTitle")}</Label>
              <Input id="ann_title" {...register("title")} aria-invalid={Boolean(errors.title)} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann_arabic_title">{t("adminHajjUmrah.fieldArabicTitle")}</Label>
              <Input id="ann_arabic_title" dir="rtl" className="font-arabic" {...register("arabic_title")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann_body">{t("adminHajjUmrah.fieldBody")}</Label>
              <Textarea id="ann_body" rows={5} {...register("body")} aria-invalid={Boolean(errors.body)} />
              {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ann_arabic_body">{t("adminHajjUmrah.fieldArabicBody")}</Label>
              <Textarea id="ann_arabic_body" dir="rtl" className="font-arabic" rows={3} {...register("arabic_body")} />
            </div>

            <SheetFooter className="mt-auto px-0">
              <Button type="submit" disabled={createMutation.isPending || isSubmitting}>
                {createMutation.isPending ? t("adminHajjUmrah.publishing") : t("adminHajjUmrah.publishAnnouncementBtn")}
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

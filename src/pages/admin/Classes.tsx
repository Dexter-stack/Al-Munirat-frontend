import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { QueryState } from "@/components/states/QueryState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminClassesApi } from "@/api/admin/classes";
import { ApiClientError } from "@/api/client";
import type { ClassLevel } from "@/types/academic";

function buildSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t("adminClasses.nameRequired")),
    arabic_name: z.string().optional(),
    description: z.string().optional(),
  });
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function AdminClassesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formTarget, setFormTarget] = useState<ClassLevel | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassLevel | null>(null);

  const classesQuery = useQuery({ queryKey: ["admin", "classes", "all"], queryFn: () => adminClassesApi.list() });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "classes"] });
  }

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => adminClassesApi.create({ ...values, status: "active" }),
    onSuccess: () => {
      toast.success(t("adminClasses.toastCreated"));
      invalidate();
      setFormTarget(null);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminClasses.toastCreateError"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: FormValues }) => adminClassesApi.update(id, values),
    onSuccess: () => {
      toast.success(t("adminClasses.toastUpdated"));
      invalidate();
      setFormTarget(null);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminClasses.toastUpdateError"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminClassesApi.remove(id),
    onSuccess: () => {
      toast.success(t("adminClasses.toastDeleted"));
      invalidate();
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminClasses.toastDeleteError"));
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("adminClasses.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("adminClasses.subtitle")}</p>
        </div>
        <Button onClick={() => setFormTarget("new")}>
          <MaterialIcon name="add" className="text-base" />
          {t("adminClasses.addClass")}
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
        <QueryState
          isLoading={classesQuery.isLoading}
          error={classesQuery.error}
          data={classesQuery.data}
          onRetry={() => classesQuery.refetch()}
          isEmpty={(d) => d.items.length === 0}
          emptyProps={{
            icon: "school",
            title: t("adminClasses.emptyTitle"),
            description: t("adminClasses.emptyDescription"),
          }}
        >
          {(data) => (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("adminClasses.colName")}</TableHead>
                  <TableHead>{t("adminClasses.colArabicName")}</TableHead>
                  <TableHead>{t("adminClasses.colDescription")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell className="font-semibold text-slate-900">{level.name}</TableCell>
                    <TableCell dir="rtl" className="font-arabic text-right">
                      {level.arabic_name || "—"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate whitespace-normal text-slate-600">
                      {level.description || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => setFormTarget(level)}>
                          <MaterialIcon name="edit" className="text-base" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => setDeleteTarget(level)}
                        >
                          <MaterialIcon name="delete" className="text-base" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </QueryState>
      </div>

      <ClassFormDialog
        target={formTarget}
        onOpenChange={(open) => !open && setFormTarget(null)}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmit={(values) => {
          if (formTarget && formTarget !== "new") {
            updateMutation.mutate({ id: formTarget.id, values });
          } else {
            createMutation.mutate(values);
          }
        }}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminClasses.deleteDialogTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {t("adminClasses.deleteConfirm", { name: deleteTarget?.name ?? "" })}
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

function ClassFormDialog({
  target,
  onOpenChange,
  isSubmitting,
  onSubmit,
}: {
  target: ClassLevel | "new" | null;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (values: FormValues) => void;
}) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);
  const isEdit = Boolean(target && target !== "new");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: target && target !== "new" ? target.name : "",
      arabic_name: target && target !== "new" ? (target.arabic_name ?? "") : "",
      description: target && target !== "new" ? (target.description ?? "") : "",
    },
  });

  return (
    <Dialog
      open={Boolean(target)}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("adminClasses.formTitleEdit") : t("adminClasses.formTitleAdd")}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("adminClasses.fieldName")}</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="arabic_name">{t("adminClasses.fieldArabicName")}</Label>
            <Input id="arabic_name" dir="rtl" className="font-arabic" {...register("arabic_name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">{t("adminClasses.fieldDescription")}</Label>
            <Textarea id="description" {...register("description")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : isEdit ? t("adminShared.saveChanges") : t("adminClasses.createClass")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { QueryState } from "@/components/states/QueryState";
import { AccountStatusBadge, PaymentStatusBadge } from "@/components/admin/StatusBadge";
import { SuspendStudentDialog } from "@/components/admin/SuspendStudentDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminStudentsApi } from "@/api/admin/students";
import { adminPaymentsApi } from "@/api/admin/payments";
import { adminClassesApi } from "@/api/admin/classes";
import { ApiClientError } from "@/api/client";

function buildEditSchema(t: (key: string) => string) {
  return z.object({
    first_name: z.string().min(1, t("adminStudentDetail.firstNameRequired")),
    last_name: z.string().min(1, t("adminStudentDetail.lastNameRequired")),
    phone: z.string().min(1, t("adminStudentDetail.phoneRequired")),
    address: z.string().optional(),
    class_id: z.string().optional(),
  });
}

type EditValues = z.infer<ReturnType<typeof buildEditSchema>>;

export default function AdminStudentDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const studentId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const studentQuery = useQuery({
    queryKey: ["admin", "students", studentId],
    queryFn: () => adminStudentsApi.get(studentId),
    enabled: Number.isFinite(studentId),
  });

  const classesQuery = useQuery({ queryKey: ["admin", "classes", "all"], queryFn: () => adminClassesApi.list() });
  const classNameById = useMemo(() => {
    const map = new Map<number, string>();
    classesQuery.data?.items.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [classesQuery.data]);

  // Nice-to-have: surface this student's payment history alongside their profile.
  const paymentsQuery = useQuery({
    queryKey: ["admin", "payments", { student_id: studentId }],
    queryFn: () => adminPaymentsApi.list({ student_id: studentId }),
    enabled: Number.isFinite(studentId),
  });

  function invalidateStudent() {
    queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "students", studentId] });
  }

  const approveMutation = useMutation({
    mutationFn: () => adminStudentsApi.approve(studentId),
    onSuccess: () => {
      toast.success(t("adminStudentDetail.toastApproved"));
      invalidateStudent();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminStudentDetail.toastApproveError"));
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (reason?: string) => adminStudentsApi.suspend(studentId, reason),
    onSuccess: () => {
      toast.success(t("adminStudentDetail.toastSuspended"));
      invalidateStudent();
      setSuspendOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminStudentDetail.toastSuspendError"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: EditValues) =>
      adminStudentsApi.update(studentId, {
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone,
        address: values.address,
        class_id: values.class_id ? Number(values.class_id) : undefined,
      }),
    onSuccess: () => {
      toast.success(t("adminStudentDetail.toastUpdated"));
      invalidateStudent();
      setEditOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminStudentDetail.toastUpdateError"));
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate("/admin/students")}>
          <MaterialIcon name="arrow_back" className="text-lg" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("adminStudentDetail.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("adminStudentDetail.subtitle")}</p>
        </div>
      </div>

      <QueryState
        isLoading={studentQuery.isLoading}
        error={studentQuery.error}
        data={studentQuery.data}
        onRetry={() => studentQuery.refetch()}
      >
        {(student) => (
          <>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white">
                    {student.first_name?.[0]}
                    {student.last_name?.[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {student.first_name} {student.last_name}
                    </h2>
                    <p className="text-sm text-slate-500">{student.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <AccountStatusBadge status={student.account_status} />
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setEditOpen(true)}>
                    <MaterialIcon name="edit" className="text-base" />
                    {t("common.edit")}
                  </Button>
                  {student.account_status !== "active" && (
                    <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                      <MaterialIcon name="check_circle" className="text-base" />
                      {t("common.approve")}
                    </Button>
                  )}
                  {student.account_status === "active" && (
                    <Button variant="destructive" onClick={() => setSuspendOpen(true)}>
                      <MaterialIcon name="block" className="text-base" />
                      {t("adminStudents.suspend")}
                    </Button>
                  )}
                </div>
              </div>

              {student.account_status === "payment_rejected" && student.rejection_reason && (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-700">{t("payment.rejectionReason")}</p>
                  <p className="mt-1 text-sm text-rose-900">{student.rejection_reason}</p>
                </div>
              )}

              <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow label={t("adminStudentDetail.infoPhone")} value={student.phone || "—"} />
                <InfoRow
                  label={t("adminStudentDetail.infoClass")}
                  value={student.class_id ? (classNameById.get(student.class_id) ?? `#${student.class_id}`) : "—"}
                />
                <InfoRow label={t("adminStudentDetail.infoGender")} value={student.gender ?? "—"} />
                <InfoRow
                  label={t("adminStudentDetail.infoDateOfBirth")}
                  value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : "—"}
                />
                <InfoRow label={t("adminStudentDetail.infoAddress")} value={student.address || "—"} />
                <InfoRow label={t("adminStudentDetail.infoDateJoined")} value={new Date(student.created_at).toLocaleDateString()} />
              </dl>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xs">
              <h3 className="mb-4 text-sm font-bold text-slate-900">{t("adminStudentDetail.paymentHistory")}</h3>
              <QueryState
                isLoading={paymentsQuery.isLoading}
                error={paymentsQuery.error}
                data={paymentsQuery.data}
                onRetry={() => paymentsQuery.refetch()}
                isEmpty={(d) => d.items.length === 0}
                emptyProps={{ icon: "receipt_long", title: t("adminStudentDetail.noPaymentsYet"), className: "py-10" }}
              >
                {(payments) => (
                  <div className="space-y-3">
                    {payments.items.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 p-3.5"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {payment.currency} {payment.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500">
                            {t("adminStudentDetail.refLabel", {
                              reference: payment.reference,
                              date: new Date(payment.payment_date).toLocaleDateString(),
                            })}
                          </p>
                        </div>
                        <PaymentStatusBadge status={payment.status} />
                      </div>
                    ))}
                  </div>
                )}
              </QueryState>
              <div className="mt-4">
                <Link to="/admin/payments" className="text-xs font-semibold text-brand-600 hover:underline">
                  {t("adminStudentDetail.reviewAllPayments")}
                </Link>
              </div>
            </div>

            <SuspendStudentDialog
              open={suspendOpen}
              onOpenChange={setSuspendOpen}
              studentName={`${student.first_name} ${student.last_name}`}
              isSubmitting={suspendMutation.isPending}
              onConfirm={(reason) => suspendMutation.mutate(reason)}
            />

            <EditStudentDialog
              open={editOpen}
              onOpenChange={setEditOpen}
              student={student}
              classOptions={classesQuery.data?.items ?? []}
              isSubmitting={updateMutation.isPending}
              onSubmit={(values) => updateMutation.mutate(values)}
            />
          </>
        )}
      </QueryState>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-bold capitalize text-slate-900">{value}</dd>
    </div>
  );
}

function EditStudentDialog({
  open,
  onOpenChange,
  student,
  classOptions,
  isSubmitting,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: { first_name: string; last_name: string; phone: string; address?: string; class_id?: number };
  classOptions: { id: number; name: string }[];
  isSubmitting: boolean;
  onSubmit: (values: EditValues) => void;
}) {
  const { t } = useTranslation();
  const editSchema = useMemo(() => buildEditSchema(t), [t]);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    values: {
      first_name: student.first_name,
      last_name: student.last_name,
      phone: student.phone,
      address: student.address ?? "",
      class_id: student.class_id ? String(student.class_id) : "",
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("adminStudentDetail.editDialogTitle")}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">{t("adminStudentDetail.firstName")}</Label>
              <Input id="first_name" {...register("first_name")} />
              {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">{t("adminStudentDetail.lastName")}</Label>
              <Input id="last_name" {...register("last_name")} />
              {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("adminStudentDetail.phone")}</Label>
            <Input id="phone" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">{t("adminStudentDetail.address")}</Label>
            <Input id="address" {...register("address")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="class_id">{t("adminStudentDetail.classLabel")}</Label>
            <Controller
              control={control}
              name="class_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="class_id" className="w-full">
                    <SelectValue placeholder={t("adminStudentDetail.selectClassPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : t("adminShared.saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

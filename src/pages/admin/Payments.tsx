import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { QueryState } from "@/components/states/QueryState";
import { PaymentStatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminPaymentsApi } from "@/api/admin/payments";
import { ApiClientError } from "@/api/client";
import type { Payment, PaymentStatus } from "@/types/payment";

// Statuses still awaiting an admin decision sort to the top of the list by default.
const REVIEW_PRIORITY: Record<PaymentStatus, number> = {
  under_review: 0,
  pending: 1,
  approved: 2,
  rejected: 3,
};

export default function AdminPaymentsPage() {
  const { t } = useTranslation();
  const STATUS_OPTIONS: { value: PaymentStatus | "all"; label: string }[] = [
    { value: "all", label: t("adminShared.allStatuses") },
    { value: "pending", label: t("adminShared.statusPayment.pending") },
    { value: "under_review", label: t("adminShared.statusPayment.under_review") },
    { value: "approved", label: t("adminShared.statusPayment.approved") },
    { value: "rejected", label: t("adminShared.statusPayment.rejected") },
  ];
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const paymentsQuery = useQuery({
    queryKey: ["admin", "payments", { page, status }],
    queryFn: () => adminPaymentsApi.list({ page, per_page: 15, status: status === "all" ? undefined : status }),
  });

  const sortedItems = useMemo(() => {
    const items = paymentsQuery.data?.items ?? [];
    return [...items].sort((a, b) => REVIEW_PRIORITY[a.status] - REVIEW_PRIORITY[b.status]);
  }, [paymentsQuery.data]);

  function closeDialog() {
    setSelected(null);
    setShowRejectForm(false);
    setRejectReason("");
  }

  const approveMutation = useMutation({
    mutationFn: (id: number) => adminPaymentsApi.approve(id),
    onSuccess: () => {
      toast.success(t("adminPayments.toastApproved"));
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      closeDialog();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminPayments.toastApproveError"));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminPaymentsApi.reject(id, reason),
    onSuccess: () => {
      toast.success(t("adminPayments.toastRejected"));
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      closeDialog();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("adminPayments.toastRejectError"));
    },
  });

  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  async function viewReceipt(paymentId: number) {
    setIsDownloadingReceipt(true);
    try {
      const blobUrl = await adminPaymentsApi.downloadReceiptBlobUrl(paymentId);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : t("adminPayments.toastReceiptError"));
    } finally {
      setIsDownloadingReceipt(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("adminPayments.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("adminPayments.subtitle")}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as PaymentStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-10 w-full rounded-xl sm:w-56">
            <SelectValue placeholder={t("adminShared.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
        <QueryState
          isLoading={paymentsQuery.isLoading}
          error={paymentsQuery.error}
          data={paymentsQuery.data}
          onRetry={() => paymentsQuery.refetch()}
          isEmpty={() => sortedItems.length === 0}
          emptyProps={{ icon: "receipt_long", title: t("adminPayments.emptyTitle"), description: t("adminPayments.emptyDescription") }}
        >
          {(data) => (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("adminPayments.colAmount")}</TableHead>
                    <TableHead>{t("adminPayments.colReference")}</TableHead>
                    <TableHead>{t("adminPayments.colPaymentDate")}</TableHead>
                    <TableHead>{t("adminPayments.colMethod")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-semibold text-slate-900">
                        {payment.currency} {Number(payment.amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{payment.reference}</TableCell>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">{payment.payment_method.replace(/_/g, " ")}</TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelected(payment)}>
                          <MaterialIcon name="visibility" className="text-base" />
                          {t("adminPayments.review")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {data.meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    {t("adminPayments.pageInfo", {
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

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{t("adminPayments.dialogTitle")}</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3">
                <DetailRow label={t("adminPayments.detailAmount")} value={`${selected.currency} ${Number(selected.amount).toLocaleString()}`} />
                <DetailRow label={t("adminPayments.detailStatus")} value={<PaymentStatusBadge status={selected.status} />} />
                <DetailRow label={t("adminPayments.detailReference")} value={selected.reference} mono />
                <DetailRow label={t("adminPayments.detailMethod")} value={selected.payment_method.replace(/_/g, " ")} className="capitalize" />
                <DetailRow label={t("adminPayments.detailPaymentDate")} value={new Date(selected.payment_date).toLocaleDateString()} />
                <DetailRow label={t("adminPayments.detailSubmitted")} value={new Date(selected.created_at).toLocaleDateString()} />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t("adminPayments.receiptLabel")}</p>
                {selected.receipts.length > 0 ? (
                  <div className="space-y-1.5">
                    {selected.receipts.map((receipt) => (
                      <div
                        key={receipt.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <MaterialIcon name="description" className="text-base text-slate-400" />
                          <span className="truncate">{receipt.original_filename}</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isDownloadingReceipt}
                          onClick={() => viewReceipt(selected.id)}
                        >
                          {isDownloadingReceipt ? t("adminPayments.loadingReceipt") : t("common.view")}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">{t("adminPayments.noReceiptUploaded")}</p>
                )}
              </div>

              {selected.admin_notes && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-700">{t("adminPayments.adminNotesLabel")}</p>
                  <p className="mt-1 text-sm text-rose-900">{selected.admin_notes}</p>
                </div>
              )}

              {showRejectForm ? (
                <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                  <Label htmlFor="reject-reason">{t("adminPayments.rejectionReasonLabel")}</Label>
                  <Textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t("adminPayments.rejectionReasonPlaceholder")}
                    className="min-h-20"
                  />
                  <DialogFooter showCloseButton={false}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRejectForm(false)}
                      disabled={rejectMutation.isPending}
                    >
                      {t("common.back")}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={!rejectReason.trim() || rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate({ id: selected.id, reason: rejectReason.trim() })}
                    >
                      {t("adminPayments.confirmRejection")}
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <DialogFooter>
                  {selected.status !== "approved" && selected.status !== "rejected" && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-rose-200 text-rose-600 hover:bg-rose-50"
                        onClick={() => setShowRejectForm(true)}
                        disabled={approveMutation.isPending}
                      >
                        <MaterialIcon name="cancel" className="text-base" />
                        {t("common.reject")}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => approveMutation.mutate(selected.id)}
                        disabled={approveMutation.isPending}
                      >
                        <MaterialIcon name="check_circle" className="text-base" />
                        {t("common.approve")}
                      </Button>
                    </>
                  )}
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className={`mt-0.5 text-sm font-bold text-slate-900 ${mono ? "font-mono" : ""} ${className ?? ""}`}>
        {value}
      </div>
    </div>
  );
}

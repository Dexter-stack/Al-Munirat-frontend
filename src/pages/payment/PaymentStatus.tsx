import type { ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { LoadingState } from "@/components/states/LoadingState";
import { ReceiptUploadForm, type ReceiptUploadValues } from "@/components/forms/ReceiptUploadForm";
import { paymentApi } from "@/api/student";
import { ApiClientError } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { accountStatusRedirect } from "@/lib/accountStatus";

export default function PaymentStatusPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ["student", "payments"],
    queryFn: paymentApi.list,
    enabled: Boolean(user),
  });

  const latestPayment = paymentsQuery.data?.[0];

  const resubmitMutation = useMutation({
    mutationFn: async ({
      values,
      onProgress,
    }: {
      values: ReceiptUploadValues;
      onProgress: (percent: number) => void;
    }) => {
      const payment = await paymentApi.create({
        amount: Number(values.amount),
        currency: latestPayment?.currency ?? "USD",
        reference: values.reference,
        payment_date: values.payment_date,
        payment_method: "bank_transfer",
      });
      return paymentApi.uploadReceipt(
        payment.id,
        {
          receipt: values.receipt,
          amount: Number(values.amount),
          payment_date: values.payment_date,
          reference: values.reference,
        },
        onProgress,
      );
    },
    onSuccess: () => {
      toast.success("Receipt resubmitted for review.");
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      queryClient.invalidateQueries({ queryKey: ["student", "payments"] });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to resubmit your receipt.");
    },
  });

  if (!user) return null;

  if (user.account_status === "pending_payment") {
    return <Navigate to="/payment" replace />;
  }

  if (user.account_status === "active" || user.role === "admin") {
    return <Navigate to={accountStatusRedirect(user)} replace />;
  }

  return (
    <div className="w-full px-4 py-10 sm:px-6 lg:px-12 lg:py-14">
      <div className="mx-auto max-w-2xl">
        {user.account_status === "payment_rejected" ? (
          <RejectedCard
            reason={latestPayment?.admin_notes ?? user.rejection_reason ?? undefined}
            isSubmitting={resubmitMutation.isPending}
            onResubmit={(values, onProgress) => resubmitMutation.mutateAsync({ values, onProgress })}
          />
        ) : user.account_status === "suspended" ? (
          <StatusCard
            icon="block"
            tone="rose"
            title={t("payment.statusSuspendedTitle")}
            description={t("payment.statusSuspendedDescription")}
          />
        ) : (
          <StatusCard
            icon="hourglass_top"
            tone="brand"
            title={t("payment.statusPendingTitle")}
            description={t("payment.statusPendingDescription")}
            footer={paymentsQuery.isLoading ? <LoadingState /> : null}
          />
        )}

        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          className="mx-auto mt-6 block text-sm font-semibold text-slate-500 hover:text-slate-700"
        >
          {t("common.back")} → {t("nav.home")}
        </button>
      </div>
    </div>
  );
}

const TONE_STYLES = {
  brand: { bg: "bg-brand-50", text: "text-brand-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
} as const;

function StatusCard({
  icon,
  tone,
  title,
  description,
  footer,
}: {
  icon: string;
  tone: keyof typeof TONE_STYLES;
  title: string;
  description: string;
  footer?: ReactNode;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-xl sm:p-10">
      <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl ${styles.bg} ${styles.text}`}>
        <MaterialIcon name={icon} className="text-3xl" />
      </div>
      <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {footer}
    </div>
  );
}

function RejectedCard({
  reason,
  isSubmitting,
  onResubmit,
}: {
  reason?: string;
  isSubmitting: boolean;
  onResubmit: (values: ReceiptUploadValues, onProgress: (percent: number) => void) => Promise<unknown>;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <StatusCard
        icon="report"
        tone="amber"
        title={t("payment.statusRejectedTitle")}
        description={t("payment.statusRejectedDescription")}
      />
      {reason && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">{t("payment.rejectionReason")}</p>
          <p className="mt-1 text-sm text-amber-900">{reason}</p>
        </div>
      )}
      <div className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">{t("payment.resubmit")}</h2>
        <ReceiptUploadForm isSubmitting={isSubmitting} onSubmit={onResubmit} />
      </div>
    </div>
  );
}

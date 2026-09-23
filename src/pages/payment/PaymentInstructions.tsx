import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { ReceiptUploadForm, type ReceiptUploadValues } from "@/components/forms/ReceiptUploadForm";
import { paymentApi } from "@/api/student";
import { ApiClientError } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function PaymentInstructionsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const instructionsQuery = useQuery({
    queryKey: ["payment", "instructions"],
    queryFn: paymentApi.instructions,
  });

  const submitMutation = useMutation({
    mutationFn: async ({
      values,
      onProgress,
    }: {
      values: ReceiptUploadValues;
      onProgress: (percent: number) => void;
    }) => {
      const payment = await paymentApi.create({
        amount: Number(values.amount),
        currency: instructionsQuery.data?.currency ?? "USD",
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
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate("/payment/status", { replace: true });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to submit your payment.");
    },
  });

  if (user && user.account_status !== "pending_payment") {
    return <Navigate to="/payment/status" replace />;
  }

  return (
    <div className="w-full px-4 py-10 sm:px-6 lg:px-12 lg:py-14">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <MaterialIcon name="account_balance" className="text-2xl" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{t("payment.instructionsTitle")}</h1>
          <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">{t("payment.instructionsSubtitle")}</p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <StepBadge n={1} />
            Bank Transfer Details
          </h2>

          {instructionsQuery.isLoading && <LoadingState />}
          {instructionsQuery.error && (
            <ErrorState error={instructionsQuery.error} onRetry={() => instructionsQuery.refetch()} />
          )}
          {instructionsQuery.data && (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label={t("payment.bankName")} value={instructionsQuery.data.bank_name} />
              <InfoRow label={t("payment.accountName")} value={instructionsQuery.data.account_name} />
              <InfoRow label={t("payment.accountNumber")} value={instructionsQuery.data.account_number} mono />
              <InfoRow
                label={t("payment.amount")}
                value={`${instructionsQuery.data.currency} ${Number(instructionsQuery.data.amount).toLocaleString()}`}
              />
              <InfoRow
                label={t("payment.reference")}
                value={instructionsQuery.data.reference}
                mono
                className="sm:col-span-2"
              />
            </dl>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-lg sm:p-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <StepBadge n={2} />
            {t("payment.uploadTitle")}
          </h2>

          <ReceiptUploadForm
            isSubmitting={submitMutation.isPending}
            onSubmit={(values, onProgress) => submitMutation.mutateAsync({ values, onProgress })}
          />
        </div>
      </div>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
      {n}
    </span>
  );
}

function InfoRow({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl bg-slate-50 p-3.5", className)}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className={cn("mt-0.5 text-sm font-bold text-slate-900", mono && "font-mono tracking-wide")}>{value}</dd>
    </div>
  );
}

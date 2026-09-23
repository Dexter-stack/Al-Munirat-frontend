import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AccountStatus } from "@/types/auth";
import type { PaymentStatus } from "@/types/payment";

const TONE_CLASSES = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
} as const;

const ACCOUNT_STATUS_TONE: Record<AccountStatus, keyof typeof TONE_CLASSES> = {
  active: "emerald",
  pending_payment: "amber",
  receipt_submitted: "amber",
  under_review: "amber",
  payment_rejected: "rose",
  suspended: "rose",
};

const PAYMENT_STATUS_TONE: Record<PaymentStatus, keyof typeof TONE_CLASSES> = {
  approved: "emerald",
  pending: "amber",
  under_review: "amber",
  rejected: "rose",
};

export function AccountStatusBadge({ status, className }: { status: AccountStatus; className?: string }) {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className={cn(TONE_CLASSES[ACCOUNT_STATUS_TONE[status] ?? "slate"], className)}>
      {t(`adminShared.statusAccount.${status}`)}
    </Badge>
  );
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className={cn(TONE_CLASSES[PAYMENT_STATUS_TONE[status] ?? "slate"], className)}>
      {t(`adminShared.statusPayment.${status}`)}
    </Badge>
  );
}

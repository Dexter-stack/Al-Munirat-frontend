import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const ACCOUNT_STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  pending_payment: "bg-amber-50 text-amber-700 border-amber-200/50",
  receipt_submitted: "bg-amber-50 text-amber-700 border-amber-200/50",
  under_review: "bg-sky-50 text-brand-700 border-sky-200/50",
  payment_rejected: "bg-rose-50 text-rose-700 border-rose-200/50",
  suspended: "bg-rose-50 text-rose-700 border-rose-200/50",
};

const ACCOUNT_STATUS_I18N_KEY: Record<string, string> = {
  active: "studentProfile.statusActive",
  pending_payment: "studentProfile.statusPendingPayment",
  receipt_submitted: "studentProfile.statusReceiptSubmitted",
  under_review: "studentProfile.statusUnderReview",
  payment_rejected: "studentProfile.statusPaymentRejected",
  suspended: "studentProfile.statusSuspended",
};

export default function StudentProfilePage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;

  const fullName = `${user.first_name} ${user.last_name}`;
  const statusStyle = ACCOUNT_STATUS_STYLES[user.account_status] ?? "bg-slate-100 text-slate-600 border-slate-200";
  const statusI18nKey = ACCOUNT_STATUS_I18N_KEY[user.account_status];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-brand-700">{t("studentProfile.eyebrow")}</span>
        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">{t("studentProfile.title")}</h1>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xs">
        <div className="flex flex-col items-center gap-4 border-b border-slate-100 pb-6 text-center sm:flex-row sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white shadow-sm ring-4 ring-sky-100">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-full w-full rounded-2xl object-cover" />
            ) : (
              `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{fullName}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle}`}>
                {statusI18nKey ? t(statusI18nKey) : user.account_status.replace(/_/g, " ")}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-600">
                {user.role === "student" ? t("studentProfile.roleStudent") : user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 pt-6 sm:grid-cols-2">
          <ProfileField icon="mail" label={t("studentProfile.emailLabel")} value={user.email} />
          <ProfileField icon="call" label={t("studentProfile.phoneLabel")} value={user.phone} />
          <ProfileField
            icon="cake"
            label={t("studentProfile.dobLabel")}
            value={user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : "—"}
          />
          <ProfileField
            icon="wc"
            label={t("studentProfile.genderLabel")}
            value={user.gender ? t(`auth.${user.gender}`) : "—"}
            capitalize
          />
          <ProfileField icon="home" label={t("studentProfile.addressLabel")} value={user.address ?? "—"} className="sm:col-span-2" />
        </div>

        <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-xs text-brand-900">
          <MaterialIcon name="info" className="mt-0.5 shrink-0 text-sm" />
          <p>{t("studentProfile.editNotice")}</p>
        </div>

        <Button
          variant="outline"
          disabled
          onClick={() => toast.info(t("studentProfile.editToast"))}
          className="mt-4 w-full rounded-xl text-sm font-semibold"
        >
          <MaterialIcon name="edit" className="text-base" />
          {t("studentProfile.editProfileButton")}
        </Button>
      </div>
    </div>
  );
}

function ProfileField({
  icon,
  label,
  value,
  capitalize,
  className,
}: {
  icon: string;
  label: string;
  value: string;
  capitalize?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <MaterialIcon name={icon} className="text-sm text-brand-600" />
        {label}
      </p>
      <p className={`mt-1 text-sm font-medium text-slate-800 ${capitalize ? "capitalize" : ""}`}>{value}</p>
    </div>
  );
}

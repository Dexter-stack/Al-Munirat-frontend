import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { QueryState } from "@/components/states/QueryState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { adminSettingsApi, type OrganizationSettings } from "@/api/admin/settings";
import { ApiClientError } from "@/api/client";

function buildSettingsSchema(t: (key: string) => string) {
  return z.object({
    site_name: z.string().min(1, t("adminSettings.siteNameRequired")),
    contact_email: z.string().min(1, t("adminSettings.contactEmailRequired")).email(t("adminSettings.contactEmailInvalid")),
    contact_phone: z.string().min(1, t("adminSettings.contactPhoneRequired")),
    address: z.string().min(1, t("adminSettings.addressRequired")),
    payment: z.object({
      bank_name: z.string().min(1, t("adminSettings.bankNameRequired")),
      account_name: z.string().min(1, t("adminSettings.accountNameRequired")),
      account_number: z.string().min(1, t("adminSettings.accountNumberRequired")),
      amount: z.number().min(0, t("adminSettings.amountError")),
      currency: z.string().min(1, t("adminSettings.currencyRequired")),
      reference: z.string().min(1, t("adminSettings.referenceRequired")),
    }),
  });
}

type SettingsFormValues = z.infer<ReturnType<typeof buildSettingsSchema>>;

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const settingsQuery = useQuery({ queryKey: ["admin", "settings"], queryFn: adminSettingsApi.get });

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("adminSettings.title")}
        description={t("adminSettings.subtitle")}
      />

      <QueryState
        isLoading={settingsQuery.isLoading}
        error={settingsQuery.error}
        data={settingsQuery.data}
        onRetry={() => settingsQuery.refetch()}
      >
        {(data) => <SettingsForm initial={data} />}
      </QueryState>
    </div>
  );
}

function SettingsForm({ initial }: { initial: OrganizationSettings }) {
  const { t } = useTranslation();
  const settingsSchema = useMemo(() => buildSettingsSchema(t), [t]);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      site_name: initial.site_name,
      contact_email: initial.contact_email,
      contact_phone: initial.contact_phone,
      address: initial.address,
      payment: {
        bank_name: initial.payment.bank_name,
        account_name: initial.payment.account_name,
        account_number: initial.payment.account_number,
        amount: Number(initial.payment.amount),
        currency: initial.payment.currency,
        reference: initial.payment.reference,
      },
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: SettingsFormValues) =>
      adminSettingsApi.update({ ...values, payment: { ...values.payment, amount: String(values.payment.amount) } }),
    onSuccess: (data) => {
      toast.success(t("adminSettings.toastSaved"));
      queryClient.setQueryData(["admin", "settings"], data);
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : t("adminSettings.toastSaveError")),
  });

  function onSubmit(values: SettingsFormValues) {
    updateMutation.mutate(values);
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>{t("adminSettings.institutionCardTitle")}</CardTitle>
          <CardDescription>{t("adminSettings.institutionCardDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="site_name">{t("adminSettings.fieldSiteName")}</Label>
            <Input id="site_name" {...register("site_name")} aria-invalid={Boolean(errors.site_name)} />
            {errors.site_name && <p className="text-xs text-destructive">{errors.site_name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact_email">{t("adminSettings.fieldContactEmail")}</Label>
              <Input
                id="contact_email"
                type="email"
                {...register("contact_email")}
                aria-invalid={Boolean(errors.contact_email)}
              />
              {errors.contact_email && <p className="text-xs text-destructive">{errors.contact_email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_phone">{t("adminSettings.fieldContactPhone")}</Label>
              <Input id="contact_phone" {...register("contact_phone")} aria-invalid={Boolean(errors.contact_phone)} />
              {errors.contact_phone && <p className="text-xs text-destructive">{errors.contact_phone.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">{t("adminSettings.fieldAddress")}</Label>
            <Textarea id="address" rows={3} {...register("address")} aria-invalid={Boolean(errors.address)} />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-brand-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <MaterialIcon name="account_balance" className="text-lg" />
            </div>
            <div>
              <CardTitle>{t("adminSettings.paymentCardTitle")}</CardTitle>
              <CardDescription>
                {t("adminSettings.paymentCardDesc")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bank_name">{t("adminSettings.fieldBankName")}</Label>
              <Input id="bank_name" {...register("payment.bank_name")} aria-invalid={Boolean(errors.payment?.bank_name)} />
              {errors.payment?.bank_name && <p className="text-xs text-destructive">{errors.payment.bank_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account_name">{t("adminSettings.fieldAccountName")}</Label>
              <Input
                id="account_name"
                {...register("payment.account_name")}
                aria-invalid={Boolean(errors.payment?.account_name)}
              />
              {errors.payment?.account_name && (
                <p className="text-xs text-destructive">{errors.payment.account_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="account_number">{t("adminSettings.fieldAccountNumber")}</Label>
              <Input
                id="account_number"
                {...register("payment.account_number")}
                aria-invalid={Boolean(errors.payment?.account_number)}
              />
              {errors.payment?.account_number && (
                <p className="text-xs text-destructive">{errors.payment.account_number.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference">{t("adminSettings.fieldReference")}</Label>
              <Input id="reference" {...register("payment.reference")} aria-invalid={Boolean(errors.payment?.reference)} />
              {errors.payment?.reference && <p className="text-xs text-destructive">{errors.payment.reference.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount">{t("adminSettings.fieldAmount")}</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step="0.01"
                {...register("payment.amount", { valueAsNumber: true })}
                aria-invalid={Boolean(errors.payment?.amount)}
              />
              {errors.payment?.amount && <p className="text-xs text-destructive">{errors.payment.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">{t("adminSettings.fieldCurrency")}</Label>
              <Input id="currency" placeholder="USD" {...register("payment.currency")} aria-invalid={Boolean(errors.payment?.currency)} />
              {errors.payment?.currency && <p className="text-xs text-destructive">{errors.payment.currency.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateMutation.isPending || isSubmitting}>
          {updateMutation.isPending ? t("common.saving") : t("adminSettings.saveSettings")}
        </Button>
      </div>
    </form>
  );
}

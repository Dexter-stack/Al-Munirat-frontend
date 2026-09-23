import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/api/auth";
import { ApiClientError } from "@/api/client";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => setSent(true),
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to send reset link.");
    },
  });

  return (
    <div className="w-full px-4 py-10 sm:px-6 lg:px-12 lg:py-14">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl bg-white p-8 shadow-xl sm:p-10">
          <div className="mb-6 flex items-center gap-2">
            <MaterialIcon name="mail_lock" className="text-xl text-brand-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">Account Recovery</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t("auth.forgotPasswordTitle")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("auth.forgotPasswordSubtitle")}</p>

          {sent ? (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <MaterialIcon name="check_circle" className="mt-0.5 shrink-0 text-emerald-600" />
              <p className="text-sm text-emerald-800">
                If an account exists for that email, a reset link is on its way. Check your inbox.
              </p>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  className="h-12 rounded-xl bg-slate-50"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <Button type="submit" disabled={mutation.isPending} className="h-12 w-full rounded-xl">
                {mutation.isPending ? t("common.submitting") : t("auth.sendResetLink")}
              </Button>
            </form>
          )}

          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
          >
            <MaterialIcon name="arrow_back" className="text-base" />
            {t("auth.backToSignIn")}
          </Link>
        </div>
      </div>
    </div>
  );
}

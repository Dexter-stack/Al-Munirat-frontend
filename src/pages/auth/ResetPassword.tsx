import { Link, useNavigate, useSearchParams } from "react-router-dom";
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

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => authApi.resetPassword({ ...values, token, email }),
    onSuccess: () => {
      toast.success("Your password has been reset. Please sign in.");
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to reset your password.");
    },
  });

  const linkInvalid = !token || !email;

  return (
    <div className="w-full px-4 py-10 sm:px-6 lg:px-12 lg:py-14">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl bg-white p-8 shadow-xl sm:p-10">
          <div className="mb-6 flex items-center gap-2">
            <MaterialIcon name="lock_reset" className="text-xl text-brand-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">Account Recovery</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t("auth.resetPasswordTitle")}</h1>

          {linkInvalid ? (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <MaterialIcon name="error" className="mt-0.5 shrink-0 text-rose-600" />
              <p className="text-sm text-rose-800">
                This reset link is invalid or has expired. Please request a new one.
              </p>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  className="h-12 rounded-xl bg-slate-50"
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password_confirmation">{t("auth.confirmPassword")}</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  className="h-12 rounded-xl bg-slate-50"
                  aria-invalid={Boolean(errors.password_confirmation)}
                  {...register("password_confirmation")}
                />
                {errors.password_confirmation && (
                  <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>
                )}
              </div>
              <Button type="submit" disabled={mutation.isPending} className="h-12 w-full rounded-xl">
                {mutation.isPending ? t("common.submitting") : t("auth.resetPassword")}
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

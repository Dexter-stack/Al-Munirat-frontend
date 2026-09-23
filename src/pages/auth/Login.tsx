import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { MaterialIcon } from "@/components/common/MaterialIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { ApiClientError } from "@/api/client";
import { accountStatusRedirect } from "@/lib/accountStatus";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      const user = await login(values);
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      navigate(from ?? accountStatusRedirect(user), { replace: true });
    } catch (error) {
      if (error instanceof ApiClientError && error.isValidation && error.errors) {
        Object.entries(error.errors).forEach(([field, messages]) => {
          if (field === "email" || field === "password") {
            setError(field, { message: messages[0] });
          }
        });
        return;
      }
      toast.error(error instanceof ApiClientError ? error.message : "Unable to sign in. Please try again.");
    }
  }

  return (
    <div className="w-full px-4 py-10 sm:px-6 lg:px-12 lg:py-14">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Branding panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden rounded-3xl bg-white p-10 shadow-xl lg:col-span-7 lg:flex">
          <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand-100/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-brand-700">
              <MaterialIcon name="verified" className="text-base" />
              <span className="text-xs font-semibold">Accredited Sanad Transmission &amp; Nusuk Partner</span>
            </div>

            <div className="mb-6 rounded-2xl bg-slate-50 p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md">
                  <MaterialIcon name="auto_stories" className="text-2xl" />
                </div>
                <div>
                  <p dir="rtl" className="font-arabic text-xl font-bold leading-tight text-brand-700">
                    وَقُل رَّبِّ زِدْنِي عِلْمًا
                  </p>
                  <p className="mt-0.5 text-xs italic text-slate-500">
                    "And say: My Lord, increase me in knowledge" — Surah Taha [20:114]
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 space-y-2">
              <div className="flex items-center gap-3">
                <span className="h-0.5 w-8 bg-brand-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Portal Gateway</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Return to Your Circle of Sacred Knowledge
              </h1>
              <p className="max-w-xl pt-1 text-sm text-slate-500">
                Access your personalized dashboard, learning materials, CBT examinations, and Hajj &amp; Umrah
                preparation resources.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              {[
                { icon: "groups_3", title: "Live Halaqahs", desc: "Guided recitation circles with certified scholars." },
                { icon: "fact_check", title: "Automated CBT", desc: "Instant grading with dynamic Harakat assessment." },
                { icon: "flight_takeoff", title: "Hajj & Umrah", desc: "Manasik guides and pilgrimage logistics." },
              ].map((f) => (
                <div key={f.title} className="rounded-xl bg-slate-50 p-4 shadow-sm">
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm">
                    <MaterialIcon name={f.icon} className="text-xl" />
                  </div>
                  <h4 className="mb-1 text-sm font-semibold text-slate-900">{f.title}</h4>
                  <p className="text-xs leading-snug text-slate-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-6">
            <div className="rounded-2xl bg-slate-50 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex -space-x-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white ring-2 ring-slate-50">
                    AH
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white ring-2 ring-slate-50">
                    MK
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-slate-50">
                    LD
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-900">500+ Active Students</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                "A transformative academic sanctuary blending traditional Isnad with modern digital learning."
              </p>
            </div>
          </div>
        </div>

        {/* Sign-in card */}
        <div className="flex flex-col lg:col-span-5">
          <div className="flex flex-1 flex-col justify-between rounded-3xl bg-white p-8 shadow-xl lg:p-10">
            <div>
              <div className="mb-6 flex items-center gap-2">
                <MaterialIcon name="lock_open" className="text-xl text-brand-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                  Secure Authentication
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{t("auth.signInTitle")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("auth.signInSubtitle")}</p>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <div className="relative flex items-center">
                    <MaterialIcon
                      name="mail"
                      className="pointer-events-none absolute start-3.5 text-xl text-slate-400"
                    />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="seeker@almunirat.org"
                      className="h-12 rounded-xl bg-slate-50 ps-11"
                      aria-invalid={Boolean(errors.email)}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <Link to="/forgot-password" className="text-xs font-semibold text-brand-600 hover:underline">
                      {t("auth.forgotPassword")}
                    </Link>
                  </div>
                  <div className="relative flex items-center">
                    <MaterialIcon
                      name="vpn_key"
                      className="pointer-events-none absolute start-3.5 text-xl text-slate-400"
                    />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      className="h-12 rounded-xl bg-slate-50 ps-11 pe-12"
                      aria-invalid={Boolean(errors.password)}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute end-3.5 text-slate-400 hover:text-slate-600"
                      aria-label="Toggle password visibility"
                    >
                      <MaterialIcon name={showPassword ? "visibility_off" : "visibility"} className="text-xl" />
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <label className="flex items-center gap-2.5 pt-1">
                  <Checkbox defaultChecked />
                  <span className="text-sm text-slate-700">{t("auth.rememberMe")}</span>
                </label>

                <Button type="submit" disabled={isSubmitting} className="mt-1 h-12 w-full rounded-xl text-sm">
                  {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
                  {!isSubmitting && <MaterialIcon name="arrow_forward" className="text-lg" />}
                </Button>
              </form>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
              <p className="text-center text-sm text-slate-500">
                {t("auth.noAccount")}{" "}
                <Link to="/register" className="font-bold text-brand-600 hover:underline">
                  {t("auth.startRegistration")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo } from "react";
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
import { publicApi } from "@/api/public";
import { ApiClientError } from "@/api/client";

export function HajjUmrahSpotlight() {
  const { t } = useTranslation();

  const SERVICES = [
    { icon: "school", title: t("home.hajjSpotlight.servicesManasikTitle"), desc: t("home.hajjSpotlight.servicesManasikDesc") },
    { icon: "group", title: t("home.hajjSpotlight.servicesScholarsTitle"), desc: t("home.hajjSpotlight.servicesScholarsDesc") },
    { icon: "hotel", title: t("home.hajjSpotlight.servicesComfortTitle"), desc: t("home.hajjSpotlight.servicesComfortDesc") },
    { icon: "badge", title: t("home.hajjSpotlight.servicesClearanceTitle"), desc: t("home.hajjSpotlight.servicesClearanceDesc") },
  ];

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("home.hajjSpotlight.errorName")),
        phone: z.string().min(6, t("home.hajjSpotlight.errorPhone")),
        email: z.string().min(1, t("home.hajjSpotlight.errorEmailRequired")).email(t("home.hajjSpotlight.errorEmailInvalid")),
        message: z.string().optional(),
      }),
    [t],
  );

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      publicApi.contact({ ...values, subject: "Hajj & Umrah Pilgrimage Inquiry" }),
    onSuccess: () => {
      toast.success(t("home.hajjSpotlight.toastSuccess"));
      reset();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : t("home.hajjSpotlight.toastError"));
    },
  });

  return (
    <section className="relative overflow-hidden bg-slate-900 py-20 text-white lg:py-28" id="hajj-umrah">
      <div className="pointer-events-none absolute right-1/4 top-0 h-[600px] w-[600px] rounded-full bg-brand-500/10 blur-3xl" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-brand-300">
              <MaterialIcon name="flight_takeoff" className="text-sm" />
              <span>{t("home.hajjSpotlight.badge")}</span>
            </div>
            <h2 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t("home.hajjSpotlight.titleLine1")} <br />
              <span className="bg-gradient-to-r from-brand-300 to-sky-200 bg-clip-text text-transparent">
                {t("home.hajjSpotlight.titleLine2")}
              </span>
            </h2>
            <p dir="rtl" className="mb-6 font-arabic text-xl text-brand-200">
              رحلتك إلى بيت الله الحرام بوعي وإتقان وإخلاص
            </p>
            <p className="mb-8 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {t("home.hajjSpotlight.description")}
            </p>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {SERVICES.map((s) => (
                <div key={s.title} className="flex items-start gap-3.5 rounded-2xl border border-slate-700 bg-slate-800/80 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300">
                    <MaterialIcon name={s.icon} className="text-lg" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{s.title}</h4>
                    <p className="mt-0.5 text-xs text-slate-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/hajj-umrah"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 hover:text-brand-200"
            >
              {t("home.hajjSpotlight.exploreLink")}
              <MaterialIcon name="arrow_forward" className="text-base" />
            </Link>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
                    {t("home.hajjSpotlight.formEyebrow")}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900">{t("home.hajjSpotlight.formTitle")}</h3>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-brand-100 bg-brand-50 text-brand-600">
                  <MaterialIcon name="travel_explore" className="text-xl" />
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="hajj-name">{t("home.hajjSpotlight.labelName")}</Label>
                  <Input id="hajj-name" className="h-11 rounded-xl bg-slate-50" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="hajj-phone">{t("home.hajjSpotlight.labelPhone")}</Label>
                    <Input id="hajj-phone" type="tel" className="h-11 rounded-xl bg-slate-50" {...register("phone")} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hajj-email">{t("home.hajjSpotlight.labelEmail")}</Label>
                    <Input id="hajj-email" type="email" className="h-11 rounded-xl bg-slate-50" {...register("email")} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hajj-message">{t("home.hajjSpotlight.labelMessage")}</Label>
                  <textarea
                    id="hajj-message"
                    rows={3}
                    className="w-full rounded-xl border border-transparent bg-slate-50 p-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    placeholder={t("home.hajjSpotlight.messagePlaceholder")}
                    {...register("message")}
                  />
                </div>
                <Button type="submit" disabled={mutation.isPending} className="h-12 w-full rounded-xl text-xs font-semibold">
                  <MaterialIcon name="send" className="text-sm" />
                  {mutation.isPending ? t("home.hajjSpotlight.submitSending") : t("home.hajjSpotlight.submitIdle")}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
